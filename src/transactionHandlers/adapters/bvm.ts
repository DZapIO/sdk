import { AddressType, getAddressInfo } from '@bigmi/core';
import axios from 'axios';
import { address, Network, networks, payments, Psbt } from 'bitcoinjs-lib';
import { broadcastTradeTx, broadcastZapTx } from '../../api';
import { exclusiveChainIds } from '../../constants/chains';
import { bitcoin, bitcoinTestnet } from '../../chains';
import { StatusCodes, TxnStatus } from '../../enums';
import { BroadcastTxParams } from '../../types';
import { BtcSigner, BtcSignPsbtParams } from '../../types/signer';
import { ZapBvmTxnDetails } from '../../types/zap/step';
import { sleep } from '../../utils/date';
import { DZapTxnError } from '../../utils/errors';
import { ChainAdapter } from './types';

const SIGHASH_ALL = 1;
const POLL_INTERVAL_MS = 10_000;
const CONFIRMATION_TIMEOUT_MS = 60 * 60_000;
const API_TIMEOUT_MS = 15_000;

type Broadcast = (params: BroadcastTxParams) => Promise<string>;

const isMainnet = (chainId: number) => chainId !== exclusiveChainIds.btcTestnet;

const getNetwork = (chainId: number): Network => (isMainnet(chainId) ? networks.bitcoin : networks.testnet);

const hexToBytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'));

// bitcoinjs needs an ecc library to derive a taproot address from its script, but a witness v1
// program is the x-only key already, so it is bech32m-encoded directly
const scriptToAddress = (script: Uint8Array, network: Network) => {
  const isP2tr = script.length === 34 && script[0] === 0x51 && script[1] === 0x20;
  return isP2tr ? address.toBech32(script.subarray(2), 1, network.bech32) : address.fromOutputScript(script, network);
};

const toXOnly = (pubKey: Uint8Array) => (pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33));

const getAddressType = (inputAddress: string) => {
  try {
    return getAddressInfo(inputAddress).type;
  } catch {
    return undefined;
  }
};

const isPsbtFinalized = (psbt: Psbt) => {
  try {
    psbt.extractTransaction();
    return true;
  } catch {
    return false;
  }
};

/**
 * Fills in what wallets need to sign an input but psbts from some providers leave out, and groups the
 * inputs to sign by the address that owns them.
 */
const prepareInputsToSign = (psbt: Psbt, network: Network, signer: BtcSigner): BtcSignPsbtParams['inputsToSign'] => {
  const publicKey = signer.account.publicKey ? hexToBytes(signer.account.publicKey) : undefined;
  const inputsByAddress = new Map<string, { address: string; sigHash: number; signingIndexes: number[] }>();

  psbt.data.inputs.forEach((input, index) => {
    const inputAddress = input.witnessUtxo ? scriptToAddress(input.witnessUtxo.script, network) : signer.account.address;
    const addressType = getAddressType(inputAddress);

    if (addressType === AddressType.p2tr) {
      if (!input.tapInternalKey && publicKey) {
        psbt.updateInput(index, { tapInternalKey: toXOnly(publicKey) });
      }
      // bitcoinjs requires it even though the protocol defaults to it
      if (!input.sighashType) {
        psbt.updateInput(index, { sighashType: SIGHASH_ALL });
      }
    }
    if (addressType === AddressType.p2sh && !input.redeemScript && publicKey) {
      psbt.updateInput(index, { redeemScript: payments.p2wpkh({ pubkey: publicKey }).output });
    }

    const entry = inputsByAddress.get(inputAddress);
    if (entry) {
      entry.signingIndexes.push(index);
    } else {
      inputsByAddress.set(inputAddress, { address: inputAddress, sigHash: SIGHASH_ALL, signingIndexes: [index] });
    }
  });

  return Array.from(inputsByAddress.values());
};

// the given esplora apis, then the explorer api of the chain's definition
const getStatusApis = (chainId: number, rpcUrls?: string[]) => {
  const explorer = (isMainnet(chainId) ? bitcoin : bitcoinTestnet).blockExplorers?.default.url;
  const explorerApi = explorer ? `${explorer.replace(/\/$/, '')}/api` : undefined;
  return [...new Set([...(rpcUrls ?? []), ...(explorerApi ? [explorerApi] : [])])];
};

/**
 * Reads whether a tx is in a block from the first api that answers. Not found means it is not in the mempool yet;
 * `error` is set only when no api could be read.
 */
const readConfirmed = async (apis: string[], txnHash: string): Promise<{ confirmed: boolean; error?: unknown }> => {
  let error: unknown = new Error('No bitcoin api to read the transaction from');
  for (const api of apis) {
    try {
      const { data } = await axios.get<{ confirmed: boolean }>(`${api.replace(/\/$/, '')}/tx/${txnHash}/status`, { timeout: API_TIMEOUT_MS });
      return { confirmed: Boolean(data?.confirmed) };
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return { confirmed: false };
      error = err;
    }
  }
  return { confirmed: false, error };
};

// the dzap api records the txs it broadcasts, which is how their status can be looked up by hash
const broadcastTrade: Broadcast = async (params) => {
  const response = await broadcastTradeTx(params);
  if (response.status !== TxnStatus.success) {
    throw new DZapTxnError(StatusCodes.Error, response.message || 'Failed to broadcast transaction');
  }
  return response.txnHash;
};

const broadcastZap: Broadcast = async (params) => {
  const response = await broadcastZapTx(params);
  if (response.status !== TxnStatus.success) {
    throw new DZapTxnError(StatusCodes.Error, response.data?.message || 'Failed to broadcast transaction');
  }
  return response.data.txnHash;
};

/**
 * Signs the psbt the DZap API built and broadcasts it through the API. Resolves once the tx is broadcast,
 * as a block can take a while; `waitForTransaction` waits for it to be mined.
 */
const send = async ({
  chainId,
  signer,
  psbtBase64,
  txId,
  broadcast,
}: {
  chainId: number;
  signer: BtcSigner;
  psbtBase64: string;
  txId?: string;
  broadcast: Broadcast;
}) => {
  if (!txId) {
    throw new DZapTxnError(StatusCodes.InvalidRequest, 'txId is required to broadcast bitcoin transactions');
  }
  const network = getNetwork(chainId);
  const psbt = Psbt.fromBase64(psbtBase64, { network });
  const inputsToSign = prepareInputsToSign(psbt, network, signer);

  // some wallets do not finalize even when asked to, so it is done here instead
  const signedPsbt = Psbt.fromHex(await signer.signPsbt({ psbt: psbt.toHex(), inputsToSign, finalize: false }), { network });
  if (!isPsbtFinalized(signedPsbt)) {
    signedPsbt.finalizeAllInputs();
  }
  const txnHash = await broadcast({ chainId, txId, txData: signedPsbt.extractTransaction().toHex() });
  return { txnHash };
};

export const bvmAdapter: ChainAdapter<BtcSigner> = {
  isSigner: (signer): signer is BtcSigner => typeof (signer as BtcSigner).signPsbt === 'function' && Boolean((signer as BtcSigner).account),

  sendTrade: async ({ chainId, signer, txnData }) => {
    if (txnData.btclnTxData) {
      throw new DZapTxnError(
        StatusCodes.InvalidRequest,
        'Bitcoin Lightning trades are paid to the invoice in btclnTxData.paymentRequest with a lightning wallet',
      );
    }
    return send({ chainId, signer, psbtBase64: txnData.data, txId: txnData.txId, broadcast: broadcastTrade });
  },

  sendTransaction: ({ chainId, signer, txnData, txId }) =>
    send({ chainId, signer, psbtBase64: (txnData as { data: string }).data, txId, broadcast: broadcastTrade }),

  sendZapStep: ({ chainId, signer, step }) => {
    const { data, txnId } = step as ZapBvmTxnDetails;
    return send({ chainId, signer, psbtBase64: data, txId: txnId, broadcast: broadcastZap });
  },

  // polls an esplora api (blockstream, mempool.space) until the tx is in a block
  waitForTransaction: async ({ chainId, txnHash, rpcUrls, timeoutMs = CONFIRMATION_TIMEOUT_MS }) => {
    const deadline = Date.now() + timeoutMs;
    let readError: unknown;
    while (Date.now() < deadline) {
      const read = await readConfirmed(getStatusApis(chainId, rpcUrls), txnHash);
      readError = read.error;
      if (read.confirmed) return { status: TxnStatus.success, txnHash };
      await sleep(POLL_INTERVAL_MS);
    }
    // a provider outage is not a tx that is still pending
    return readError ? { status: TxnStatus.error, txnHash, error: readError } : { status: TxnStatus.mining, txnHash };
  },
};
