import axios from 'axios';
import { StatusCodes, TxnStatus } from '../../enums';
import { WaitForTxnResponse } from '../../types';
import { SuiSigner } from '../../types/signer';
import { sleep } from '../../utils/date';
import { DZapTxnError } from '../../utils/errors';
import { ChainAdapter } from './types';

const POLL_INTERVAL_MS = 1_000;
const CONFIRMATION_TIMEOUT_MS = 60_000;
const RPC_TIMEOUT_MS = 15_000;

type SuiEffectsStatus = { status: 'success' | 'failure'; error?: string };

/**
 * Calls each rpc in turn until one answers. A node that cannot be reached or refuses the request (e.g. a bad key
 * or a rate limit, which come back as http errors) is skipped; an error the node answers the call itself with is
 * thrown, as another node would answer it the same. Executing a signed tx again on another node is safe, as it
 * has the same digest.
 */
const callSuiRpc = async <T>(rpcUrls: string[] | undefined, method: string, params: unknown[]): Promise<T> => {
  if (!rpcUrls?.length) {
    // the client takes them from the chain config; they are only missing when it cannot be fetched
    throw new DZapTxnError(StatusCodes.InvalidRequest, 'No Sui rpc to use: pass rpcUrls, or set them with DZapClient.getInstance');
  }
  let lastError: unknown;
  for (const url of rpcUrls) {
    let data: { result?: T; error?: { message?: string } } | undefined;
    try {
      ({ data } = await axios.post(url, { jsonrpc: '2.0', id: 1, method, params }, { timeout: RPC_TIMEOUT_MS }));
    } catch (error) {
      lastError = error;
      continue;
    }
    if (data?.error) {
      throw new Error(data.error.message ?? `${method} failed`);
    }
    return data?.result as T;
  }
  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  // not left as an axios error, which the error mapper would read as the DZap API failing
  throw new DZapTxnError(StatusCodes.Error, `No Sui rpc could serve ${method}: ${reason}`, { cause: lastError });
};

const toWaitResponse = (effects: SuiEffectsStatus, txnHash: string): WaitForTxnResponse =>
  effects.status === 'success' ? { status: TxnStatus.success, txnHash } : { status: TxnStatus.reverted, txnHash, error: effects.error };

/**
 * Polls a digest until its effects are known. A node that answers it does not know the digest yet leaves it pending;
 * when no node could be read at the end, that is an `error` rather than a pending tx.
 */
const pollTransaction = async (txnHash: string, rpcUrls?: string[], timeoutMs = CONFIRMATION_TIMEOUT_MS): Promise<WaitForTxnResponse> => {
  const deadline = Date.now() + timeoutMs;
  let readError: unknown;
  while (Date.now() < deadline) {
    try {
      const result = await callSuiRpc<{ effects?: { status?: SuiEffectsStatus } }>(rpcUrls, 'sui_getTransactionBlock', [
        txnHash,
        { showEffects: true },
      ]);
      readError = undefined;
      if (result?.effects?.status) return toWaitResponse(result.effects.status, txnHash);
    } catch (error) {
      // a DZapTxnError is no node being reachable; any other error is a node answering, e.g. that it has not indexed the digest yet
      readError = error instanceof DZapTxnError ? error : undefined;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return readError ? { status: TxnStatus.error, txnHash, error: readError } : { status: TxnStatus.mining, txnHash };
};

/**
 * Signs the tx bytes the DZap API built and executes them on the rpc, as the API cannot broadcast sui txs.
 * Resolves with the digest once executed.
 */
const send = async ({ signer, data, rpcUrls }: { signer: SuiSigner; data: string; rpcUrls?: string[] }) => {
  const { bytes, signature } = await signer.signTransactionBytes(data);
  const result = await callSuiRpc<{ digest: string; effects?: { status?: SuiEffectsStatus }; rawEffects?: number[] }>(
    rpcUrls,
    'sui_executeTransactionBlock',
    [bytes, [signature], { showEffects: true, showRawEffects: true }],
  );
  const txnHash = result.digest;

  // wallets track the objects they own from the effects of what they signed, and reuse stale versions otherwise
  if (result.rawEffects && signer.reportTransactionEffects) {
    await signer
      .reportTransactionEffects(Buffer.from(result.rawEffects).toString('base64'))
      .catch((error) => console.warn('Failed to report transaction effects to the wallet', error));
  }

  // the effects come back once a validator quorum executed the tx, which is final on sui, so a failure is
  // known right away; without them, waitForTransaction looks the tx up
  if (result.effects?.status?.status === 'failure') {
    const reason = result.effects.status.error ? `: ${result.effects.status.error}` : '';
    throw new DZapTxnError(StatusCodes.ContractExecutionError, `Transaction failed on chain${reason}`, { txnHash });
  }
  return { txnHash };
};

export const suivmAdapter: ChainAdapter<SuiSigner> = {
  isSigner: (signer): signer is SuiSigner => typeof (signer as SuiSigner).signTransactionBytes === 'function',

  sendTrade: ({ signer, txnData, rpcUrls }) => send({ signer, data: txnData.data, rpcUrls }),

  sendTransaction: ({ signer, txnData, rpcUrls }) => send({ signer, data: (txnData as { data: string }).data, rpcUrls }),

  sendZapStep: () => Promise.reject(new DZapTxnError(StatusCodes.InvalidRequest, 'Zaps are not supported on Sui')),

  waitForTransaction: ({ txnHash, rpcUrls, timeoutMs }) => pollTransaction(txnHash, rpcUrls, timeoutMs),
};
