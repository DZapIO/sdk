import axios from 'axios';
import { SUI_DEFAULT_RPC } from '../../constants/rpc';
import { StatusCodes, TxnStatus } from '../../enums';
import { WaitForTxnResponse } from '../../types';
import { SuiSigner } from '../../types/signer';
import { isEvmSigner } from '../../utils';
import { sleep } from '../../utils/date';
import { DZapTxnError } from '../../utils/errors';
import { ChainAdapter } from './types';

const POLL_INTERVAL_MS = 1_000;
const CONFIRMATION_TIMEOUT_MS = 60_000;

type SuiEffectsStatus = { status: 'success' | 'failure'; error?: string };

const callSuiRpc = async <T>(rpcUrls: string[] | undefined, method: string, params: unknown[]): Promise<T> => {
  const { data } = await axios.post(rpcUrls?.[0] ?? SUI_DEFAULT_RPC, { jsonrpc: '2.0', id: 1, method, params });
  if (data?.error) {
    throw new Error(data.error.message ?? `${method} failed`);
  }
  return data.result as T;
};

const toWaitResponse = (effects: SuiEffectsStatus, txnHash: string): WaitForTxnResponse =>
  effects.status === 'success' ? { status: TxnStatus.success, txnHash } : { status: TxnStatus.reverted, txnHash, error: effects.error };

const pollTransaction = async (txnHash: string, rpcUrls?: string[], timeoutMs = CONFIRMATION_TIMEOUT_MS): Promise<WaitForTxnResponse> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const result = await callSuiRpc<{ effects?: { status?: SuiEffectsStatus } }>(rpcUrls, 'sui_getTransactionBlock', [
        txnHash,
        { showEffects: true },
      ]);
      if (result?.effects?.status) return toWaitResponse(result.effects.status, txnHash);
    } catch (error) {
      // a digest the node has not indexed yet reads as not found
      console.debug('Failed to get sui transaction', error);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return { status: TxnStatus.mining, txnHash };
};

/**
 * Signs the tx bytes the DZap API built and executes them on the rpc, as the API cannot broadcast sui txs.
 */
const send = async ({ signer, data, rpcUrls }: { signer: SuiSigner; data: string; rpcUrls?: string[] }) => {
  const { bytes, signature } = await signer.signTransaction(data);
  const result = await callSuiRpc<{ digest: string; effects?: { status?: SuiEffectsStatus } }>(rpcUrls, 'sui_executeTransactionBlock', [
    bytes,
    [signature],
    { showEffects: true },
  ]);
  const txnHash = result.digest;

  // the effects are there once a validator quorum executed the tx, which is final on sui
  const receipt = result.effects?.status ? toWaitResponse(result.effects.status, txnHash) : await pollTransaction(txnHash, rpcUrls);
  if (receipt.status === TxnStatus.reverted) {
    const reason = typeof receipt.error === 'string' ? `: ${receipt.error}` : '';
    throw new DZapTxnError(StatusCodes.ContractExecutionError, `Transaction failed on chain${reason}`, { txnHash });
  }
  if (receipt.status !== TxnStatus.success) {
    throw new DZapTxnError(StatusCodes.TransactionNotConfirmed, 'Transaction was not confirmed in time', { txnHash });
  }
  return { txnHash };
};

export const suivmAdapter: ChainAdapter<SuiSigner> = {
  isSigner: (signer): signer is SuiSigner => !isEvmSigner(signer) && typeof (signer as SuiSigner).signTransaction === 'function',

  sendTrade: ({ signer, txnData, rpcUrls }) => send({ signer, data: txnData.data, rpcUrls }),

  sendTransaction: ({ signer, txnData, rpcUrls }) => send({ signer, data: (txnData as { data: string }).data, rpcUrls }),

  sendZapStep: () => Promise.reject(new DZapTxnError(StatusCodes.InvalidRequest, 'Zaps are not supported on Sui')),

  waitForTransaction: ({ txnHash, rpcUrls, timeoutMs }) => pollTransaction(txnHash, rpcUrls, timeoutMs),
};
