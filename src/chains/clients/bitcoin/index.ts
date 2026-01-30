import type { Config } from '@bigmi/client';
import type { GetConnectorClientReturnType } from '@bigmi/client/dist/esm/actions/getConnectorClient';
import type { ChainId } from '@bigmi/core';
import { getBalance } from '@bigmi/core';
import { AddressType, type Client, getAddressInfo, hexToUnit8Array, signPsbt, withTimeout } from '@bigmi/core';
import * as ecc from '@bitcoinerlab/secp256k1';
import mempoolJS from '@mempool/mempool.js';
import type { Tx, TxStatus } from '@mempool/mempool.js/lib/interfaces/bitcoin/transactions';
import { address, initEccLib, networks, Psbt } from 'bitcoinjs-lib';

import { TradeApiClient } from '../../../api/trade';
import { ZapApiClient } from '../../../api/zap';
import { chainIds, chainTypes, DZAP_NATIVE_TOKEN_FORMAT, Services } from '../../../constants';
import { ZAP_STEP_ACTIONS } from '../../../constants/zap';
import { StatusCodes, TxnStatus } from '../../../enums';
import { ChainsService } from '../../../service/chains';
import type { DZapTransactionResponse, HexString, TradeBuildTxnResponse } from '../../../types';
import type { ZapBuildTxnResponse } from '../../../types/zap/build';
import type { ZapBuildTxnPayload, ZapBvmTxnDetails } from '../../../types/zap/step';
import { generateRedeemScript, isPsbtFinalized, toXOnly } from '../../../utils/bitcoin';
import { NotFoundError, parseError, ServerError, ValidationError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { BaseChainClient } from '../base';
import type { GetBalanceParams, SendTransactionParams, TokenBalance, TransactionReceipt, WaitForReceiptParams } from '../types';

export type BitcoinNetwork = typeof networks.bitcoin | typeof networks.testnet;

/** Bitcoin client interface for signing PSBTs. */
export type BitcoinSigner = GetConnectorClientReturnType<Config, ChainId>;

export type WaitForMempoolTransactionParameters = {
  txid: string;
  pollingInterval?: number;
  timeout?: number;
  confirmations?: number;
};

/** Bitcoin (BVM) chain implementation. Handles PSBT signing and mempool broadcast. */
export class BitcoinChain extends BaseChainClient {
  constructor() {
    super(chainTypes.bvm, [chainIds.bitcoin, chainIds.bitcoinTestnet]);
    initEccLib(ecc);
  }

  private async broadcastZapMempoolTx({ txId, txHex, chainId }: { txHex: string; txId: string; chainId: number }): Promise<string> {
    try {
      const txData = await ZapApiClient.broadcastZapTx({ txId, chainId, txData: txHex });
      if (txData.status === TxnStatus.success) {
        return txData.data.txnHash;
      }
      throw new ServerError((txData as { data?: { message?: string } }).data?.message || 'Transaction broadcast failed');
    } catch (error) {
      logger.error('Zap mempool broadcast failed', { txId, chainId, error });
      throw error;
    }
  }

  private async broadcastTradeMempoolTx({ txId, txHex, chainId }: { txHex: string; txId: string; chainId: number }): Promise<string> {
    try {
      const txData = await TradeApiClient.broadcastTradeTx({ txId, chainId, txData: txHex });
      if (txData.status === TxnStatus.success) {
        return txData.txnHash;
      }
      throw new ServerError((txData as { message?: string }).message || 'Transaction broadcast failed');
    } catch (error) {
      logger.error('Trade mempool broadcast failed', { txId, chainId, error });
      throw error;
    }
  }

  private getNetwork(chainId: number): BitcoinNetwork {
    return chainId === chainIds.bitcoinTestnet ? networks.testnet : networks.bitcoin;
  }

  async getBalance(params: GetBalanceParams): Promise<TokenBalance[]> {
    const { account, chainId, tokenAddresses = [] } = params;
    const zeroAddress = DZAP_NATIVE_TOKEN_FORMAT;

    try {
      const btcClient = ChainsService.getPublicBitcoinClient(chainId);
      const balance = await getBalance(btcClient, { address: account });

      if (tokenAddresses.length === 0 || tokenAddresses.includes(zeroAddress)) {
        return [{ contract: zeroAddress, balance }];
      }

      return tokenAddresses.map((address) => ({
        contract: address,
        balance: address === zeroAddress ? balance : BigInt(0),
      }));
    } catch (error) {
      logger.error('Failed to fetch Bitcoin balance', { service: 'BitcoinChain', method: 'getBalance', account, error });
      return tokenAddresses.length > 0
        ? tokenAddresses.map((address) => ({ contract: address, balance: BigInt(0) }))
        : [{ contract: zeroAddress, balance: BigInt(0) }];
    }
  }

  /** Signs a PSBT and finalizes inputs. */
  private async signPsbtTx(chainId: number, psbtTx: string, client: Client): Promise<Psbt> {
    const network = this.getNetwork(chainId);
    const psbt = Psbt.fromBase64(psbtTx, { network });

    psbt.data.inputs.forEach((input, index) => {
      const accountAddress = input.witnessUtxo ? address.fromOutputScript(input.witnessUtxo.script, network) : (client.account?.address as string);
      const addressInfo = getAddressInfo(accountAddress);

      if (addressInfo.type === AddressType.p2tr) {
        // Taproot (P2TR) addresses require specific PSBT fields for proper signing
        if (!input.tapInternalKey) {
          const pubKey = client.account?.publicKey;
          if (pubKey) {
            const tapInternalKey = toXOnly(hexToUnit8Array(pubKey));
            psbt.updateInput(index, {
              tapInternalKey,
            });
          }
        }
        if (!input.sighashType) {
          psbt.updateInput(index, {
            sighashType: 1, // Default to Transaction.SIGHASH_ALL - 1
          });
        }
      }

      if (addressInfo.type === AddressType.p2sh) {
        if (!input.redeemScript) {
          const pubKey = client.account?.publicKey;
          if (pubKey) {
            psbt.updateInput(index, {
              redeemScript: generateRedeemScript(hexToUnit8Array(pubKey)),
            });
          }
        }
      }
    });

    const inputsToSign = Array.from(
      psbt.data.inputs
        .reduce((map, input, index) => {
          const accountAddress = input.witnessUtxo
            ? address.fromOutputScript(input.witnessUtxo.script, network)
            : (client.account?.address as string);
          if (map.has(accountAddress)) {
            map.get(accountAddress).signingIndexes.push(index);
          } else {
            map.set(accountAddress, {
              address: accountAddress,
              sigHash: 1, // SIGHASH_ALL
              signingIndexes: [index],
            });
          }
          return map;
        }, new Map())
        .values(),
    );

    const signedPsbtHex = await withTimeout(
      () =>
        signPsbt(client, {
          psbt: psbt.toHex(),
          inputsToSign,
          finalize: false,
        }),
      {
        timeout: 600_000, // 10 min signing window
        errorInstance: new Error('Transaction signing expired'),
      },
    );

    const signedPsbt = Psbt.fromHex(signedPsbtHex);

    if (!isPsbtFinalized(signedPsbt)) {
      signedPsbt.finalizeAllInputs();
    }
    return signedPsbt;
  }

  private getPsbtHexAndTxId(
    txnData: TradeBuildTxnResponse | ZapBuildTxnResponse | ZapBuildTxnPayload,
    service: typeof Services.trade | typeof Services.zap,
  ): { psbtHex: string; txId: string } {
    if (service === Services.trade) {
      const tradeData = txnData as TradeBuildTxnResponse;
      const psbtHex = tradeData?.data;
      const txId = tradeData?.txId;
      if (!psbtHex || !txId) throw new ValidationError('Invalid Transaction Data');
      return { psbtHex, txId };
    }
    const zapData = txnData as ZapBuildTxnResponse;
    const executeStep = zapData.steps?.find((step) => step.action === ZAP_STEP_ACTIONS.execute && step.data?.type === chainTypes.bvm);
    if (!executeStep?.data || !('data' in executeStep.data) || !('txnId' in executeStep.data)) {
      throw new NotFoundError('Execute step with BVM data not found in zap route');
    }
    const bvmTxnData = executeStep.data as ZapBvmTxnDetails;
    return { psbtHex: bvmTxnData.data, txId: bvmTxnData.txnId };
  }

  /** Signs PSBT from txnData (psbtHex + txId) and broadcasts via trade or zap API. */
  async sendTransaction(params: SendTransactionParams<typeof chainIds.bitcoin | typeof chainIds.bitcoinTestnet>): Promise<DZapTransactionResponse> {
    const { chainId, txnData, signer, service } = params;

    try {
      if (!txnData) {
        throw new ValidationError('Invalid Transaction Data');
      }
      if (!service || (service !== Services.zap && service !== Services.trade)) {
        throw new ValidationError(`Bitcoin broadcast requires service: "${Services.zap}" or "${Services.trade}"`);
      }

      const { psbtHex, txId } = this.getPsbtHexAndTxId(txnData, service);

      const signedPsbt = await this.signPsbtTx(chainId, psbtHex, signer);
      const txHex = signedPsbt.extractTransaction().toHex();
      const txHash =
        service === Services.trade
          ? await this.broadcastTradeMempoolTx({ txHex, chainId, txId })
          : await this.broadcastZapMempoolTx({ txHex, chainId, txId });

      return {
        code: StatusCodes.Success,
        status: TxnStatus.success,
        txnHash: txHash as HexString,
      };
    } catch (error) {
      return {
        ...parseError(error),
        error,
      };
    }
  }

  async waitForTransactionReceipt(params: WaitForReceiptParams): Promise<TransactionReceipt> {
    const { txHash, additionalData } = params;

    try {
      const waitParams = (additionalData as WaitForMempoolTransactionParameters) || {};
      const transaction = await this.waitForMempoolTransaction({
        txid: txHash,
        pollingInterval: waitParams.pollingInterval || 10000, // 10 seconds
        timeout: waitParams.timeout || 3600000, // 1 hour
      });

      if (!transaction.status.confirmed) {
        return { status: TxnStatus.error, txHash };
      }

      return {
        status: TxnStatus.success,
        txHash,
      };
    } catch (error) {
      return { status: TxnStatus.error, txHash, error };
    }
  }

  private async waitForMempoolTransaction({ txid, pollingInterval = 10000, timeout = 3600000 }: WaitForMempoolTransactionParameters): Promise<Tx> {
    return new Promise((resolve, reject) => {
      const {
        bitcoin: { transactions },
      } = mempoolJS();

      async function checkTransaction() {
        try {
          const txStatus: TxStatus = await transactions.getTxStatus({ txid });
          if (txStatus.confirmed) {
            const tx: Tx = await transactions.getTx({ txid });
            clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
            resolve(tx);
          }
        } catch (error) {
          logger.debug('Transaction not yet in mempool', { txid, error });
        }
      }

      const intervalId = setInterval(checkTransaction, pollingInterval);
      const timeoutId = timeout
        ? setTimeout(() => {
            clearInterval(intervalId);
            reject(new Error(`Transaction confirmation timeout: ${timeout}ms for txid ${txid}`));
          }, timeout)
        : undefined;

      checkTransaction();
    });
  }
}
