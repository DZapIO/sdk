import { clusterApiUrl, Connection, Finality, SendOptions, SignatureStatus, VersionedTransaction } from '@solana/web3.js';
import { broadcastTradeTx, executeZapSvmBundle } from '../../api';
import { StatusCodes, TxnStatus } from '../../enums';
import { SvmTxData } from '../../types';
import { SvmSigner } from '../../types/signer';
import { SVMTxnDetails } from '../../types/zap/step';
import { isEvmSigner } from '../../utils';
import { sleep } from '../../utils/date';
import { DZapTxnError } from '../../utils/errors';
import { ChainAdapter } from './types';

const POLL_INTERVAL_MS = 2_000;
const BLOCKHASH_CHECK_INTERVAL_MS = 10_000;
const CONFIRMATION_TIMEOUT_MS = 90_000;

// preflight is skipped since the api already simulated the tx, and the rpc's own retries are kept low
// as the tx is resent on every poll until it lands or its blockhash expires
const SEND_OPTIONS: SendOptions = { skipPreflight: true, maxRetries: 2, preflightCommitment: 'confirmed' };

type Blockhash = { blockhash?: string; lastValidBlockHeight?: number };

type SignatureOutcome = typeof TxnStatus.success | typeof TxnStatus.reverted | undefined;

const EXPIRED = 'expired';

// what a tx sent to the rpc settled to, or that its blockhash ran out before it landed
type SendOutcome = SignatureOutcome | typeof EXPIRED;

// how long the outcome of a send is kept for waitForTransaction to pick up
const SEND_OUTCOME_TTL_MS = 10 * 60_000;

// txs sent to the rpc are resent in the background until they land, and waitForTransaction awaits that
// rather than polling a second time, so it learns when a blockhash expired
const rpcSends = new Map<string, Promise<SendOutcome>>();

// web3.js otherwise retries a rate limited rpc for ~15s before failing, which is spent before the wallet even opens;
// the next rpc is tried instead
const getConnections = (rpcUrls?: string[]) =>
  (rpcUrls?.length ? rpcUrls : [clusterApiUrl('mainnet-beta')]).map(
    (url) => new Connection(url, { commitment: 'confirmed', disableRetryOnRateLimit: true }),
  );

/**
 * Makes a call on each rpc in turn until one serves it, and returns the connection that did. Sending the same
 * signed tx to another rpc is safe, as it lands once under its signature.
 */
const withFirstServing = async <T>(connections: Connection[], call: (connection: Connection) => Promise<T>) => {
  let lastError: unknown;
  for (const connection of connections) {
    try {
      return { result: await call(connection), connection };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const deserialize = (data: string) => VersionedTransaction.deserialize(Buffer.from(data, 'base64'));

const serializeToBase64 = (tx: VersionedTransaction) => Buffer.from(tx.serialize()).toString('base64');

// a build carries one tx, or the several txs of a jito bundle
const toTxList = (data: string | string[]) => (Array.isArray(data) ? data : [data]);

const readOutcome = (status: SignatureStatus | null, commitment: Finality): SignatureOutcome => {
  if (!status) return undefined;
  if (status.err) return TxnStatus.reverted;
  const level = status.confirmationStatus;
  const settled = commitment === 'finalized' ? level === 'finalized' : level === 'confirmed' || level === 'finalized';
  return settled ? TxnStatus.success : undefined;
};

/**
 * Polls a signature until it settles at the commitment, the timeout runs out or `shouldStop` says so, moving on
 * to the next rpc when one fails. `onPending` runs after every poll that did not settle it, and learns whether the
 * tx has been seen on chain yet.
 */
const pollSignature = async ({
  connections,
  signature,
  commitment,
  timeoutMs = CONFIRMATION_TIMEOUT_MS,
  onPending,
  shouldStop,
}: {
  connections: Connection[];
  signature: string;
  commitment: Finality;
  timeoutMs?: number;
  onPending?: (seen: boolean) => Promise<void>;
  shouldStop?: () => boolean;
}): Promise<SignatureOutcome> => {
  let current = 0;
  const poll = async () => {
    const { value } = await connections[current].getSignatureStatuses([signature], { searchTransactionHistory: true });
    return { outcome: readOutcome(value[0], commitment), seen: value[0] != null };
  };

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    let seen = false;
    try {
      const result = await poll();
      if (result.outcome) return result.outcome;
      seen = result.seen;
    } catch (error) {
      console.warn('Failed to get signature status', error);
      current = (current + 1) % connections.length;
    }
    await onPending?.(seen);
    if (shouldStop?.()) break;
  }
  // one last look, as the tx may have settled during the final wait
  return (await poll().catch(() => undefined))?.outcome;
};

/**
 * Sets the blockhash of txs to a fresh one, so that they do not expire while the user signs. A given
 * blockhash is kept, as the api already signed part of the tx over it.
 */
const withBlockhash = async (connections: Connection[], txs: VersionedTransaction[], given?: Blockhash): Promise<number> => {
  const { blockhash, lastValidBlockHeight } =
    given?.blockhash && given.lastValidBlockHeight
      ? (given as Required<Blockhash>)
      : (await withFirstServing(connections, (connection) => connection.getLatestBlockhash('confirmed'))).result;
  txs.forEach((tx) => (tx.message.recentBlockhash = blockhash));
  return lastValidBlockHeight;
};

const signAll = async (signer: SvmSigner, txs: VersionedTransaction[]) => {
  if (txs.length > 1 && signer.signAllTransactions) {
    return signer.signAllTransactions(txs);
  }
  const signedTxs: VersionedTransaction[] = [];
  for (const tx of txs) {
    signedTxs.push(await signer.signTransaction(tx));
  }
  return signedTxs;
};

/**
 * Resends a tx on every poll until it lands, as rpc nodes drop txs that do not land right away. It is given
 * up on once its blockhash expired. Resends start on the rpc that took the tx, and move on to the next rpc
 * when that one fails.
 */
const resendUntilLanded = async (
  connection: Connection,
  connections: Connection[],
  rawTx: Uint8Array,
  signature: string,
  lastValidBlockHeight: number,
): Promise<SendOutcome> => {
  // the rpc that took the tx first, which sees it land soonest, then the others
  let ordered = [connection, ...connections.filter((other) => other !== connection)];
  const stickTo = (served: Connection) => {
    ordered = [served, ...ordered.filter((other) => other !== served)];
  };

  let lastBlockhashCheck = Date.now();
  let expired = false;
  const outcome = await pollSignature({
    connections: ordered,
    signature,
    commitment: 'confirmed',
    shouldStop: () => expired,
    onPending: async (seen) => {
      if (seen) return;
      withFirstServing(ordered, (rpc) => rpc.sendRawTransaction(rawTx, SEND_OPTIONS))
        .then(({ connection: served }) => stickTo(served))
        .catch((error) => console.warn('Failed to resend transaction', error));
      if (Date.now() - lastBlockhashCheck < BLOCKHASH_CHECK_INTERVAL_MS) return;
      lastBlockhashCheck = Date.now();
      const blockHeight = await withFirstServing(ordered, (rpc) => rpc.getBlockHeight('confirmed'))
        .then(({ result }) => result)
        .catch(() => undefined);
      expired = blockHeight !== undefined && blockHeight > lastValidBlockHeight;
    },
  });
  return outcome ?? (expired ? EXPIRED : undefined);
};

/**
 * Sends a tx to the rpc and resolves with its signature, while it keeps being resent in the background.
 */
const sendToRpc = async (connections: Connection[], signedTx: VersionedTransaction, lastValidBlockHeight: number) => {
  const rawTx = signedTx.serialize();
  const { result: signature, connection } = await withFirstServing(connections, (rpc) => rpc.sendRawTransaction(rawTx, SEND_OPTIONS));

  const outcome = resendUntilLanded(connection, connections, rawTx, signature, lastValidBlockHeight).catch(() => undefined);
  rpcSends.set(signature, outcome);
  outcome.finally(() => {
    const timer: { unref?: () => void } | number = setTimeout(() => rpcSends.delete(signature), SEND_OUTCOME_TTL_MS);
    // so that a pending cleanup does not keep a node process alive
    if (typeof timer === 'object') timer.unref?.();
  });
  return { txnHash: signature };
};

// a tx a third party (e.g. an rfq market maker) signed too is sent by the api, as built
const sendThroughApi = async ({ chainId, txId, signedTx }: { chainId: number; txId?: string; signedTx: VersionedTransaction }) => {
  if (!txId) {
    throw new DZapTxnError(StatusCodes.InvalidRequest, 'txId is required to broadcast this transaction');
  }
  const response = await broadcastTradeTx({ chainId, txId, txData: serializeToBase64(signedTx) });
  if (response.status !== TxnStatus.success) {
    throw new DZapTxnError(StatusCodes.Error, response.message || 'Failed to broadcast transaction');
  }
  return response.txnHash;
};

const sendJitoBundle = async (chainId: number, signedTxs: VersionedTransaction[]) => {
  const response = await executeZapSvmBundle({ chainId, txnData: { signedTransactionsBase64: signedTxs.map(serializeToBase64) } });
  if (response.status !== TxnStatus.success) {
    throw new DZapTxnError(StatusCodes.Error, response.message || 'Failed to send the transaction bundle');
  }
  // the last tx of a bundle is the one carrying the dzap tracking id
  return response.data.txHashes[response.data.txHashes.length - 1];
};

const send = async ({
  chainId,
  signer,
  data,
  blockhash,
  broadcastViaProvider,
  txId,
  rpcUrls,
}: {
  chainId: number;
  signer: SvmSigner;
  data: string[];
  blockhash?: Blockhash;
  broadcastViaProvider?: boolean;
  txId?: string;
  rpcUrls?: string[];
}): Promise<{ txnHash: string }> => {
  if (!data.length) {
    throw new DZapTxnError(StatusCodes.InvalidRequest, 'No Solana transaction to send');
  }
  const connections = getConnections(rpcUrls);
  const txs = data.map(deserialize);
  // a third party's signature is over the blockhash the tx was built with, so it is left as is
  const lastValidBlockHeight = broadcastViaProvider ? undefined : await withBlockhash(connections, txs, blockhash);
  const signedTxs = await signAll(signer, txs);

  // the api lands what it broadcasts itself: several txs as a jito bundle, a third party signed tx as built
  if (signedTxs.length > 1) {
    return { txnHash: await sendJitoBundle(chainId, signedTxs) };
  }
  if (lastValidBlockHeight === undefined) {
    return { txnHash: await sendThroughApi({ chainId, txId, signedTx: signedTxs[0] }) };
  }
  return sendToRpc(connections, signedTxs[0], lastValidBlockHeight);
};

export const svmAdapter: ChainAdapter<SvmSigner> = {
  // a sui signer signs with signTransactionBytes, so a signer that has it is not taken for a solana one
  isSigner: (signer): signer is SvmSigner =>
    !isEvmSigner(signer) && typeof (signer as SvmSigner).signTransaction === 'function' && !('signTransactionBytes' in signer),

  sendTrade: ({ chainId, signer, txnData, rpcUrls }) =>
    send({
      chainId,
      signer,
      data: toTxList(txnData.data),
      blockhash: txnData.svmTxData,
      broadcastViaProvider: txnData.broadcastViaProvider,
      txId: txnData.txId,
      rpcUrls,
    }),

  sendTransaction: ({ chainId, signer, txnData, txId, rpcUrls }) => {
    const { data, blockhash, lastValidBlockHeight, broadcastViaProvider } = txnData as SvmTxData;
    return send({
      chainId,
      signer,
      data: toTxList(data),
      blockhash: { blockhash, lastValidBlockHeight },
      broadcastViaProvider,
      txId,
      rpcUrls,
    });
  },

  sendZapStep: ({ chainId, signer, step, rpcUrls }) => {
    const { data, blockhash } = step as SVMTxnDetails;
    return send({ chainId, signer, data, blockhash, rpcUrls });
  },

  // a tx this sdk sent to the rpc is awaited as it is resent, which bounds the wait by its blockhash
  waitForTransaction: async ({ txnHash, rpcUrls, timeoutMs }) => {
    const rpcSend = rpcSends.get(txnHash);
    const outcome = rpcSend
      ? await rpcSend
      : await pollSignature({ connections: getConnections(rpcUrls), signature: txnHash, commitment: 'confirmed', timeoutMs });
    if (outcome === EXPIRED) {
      const error = new DZapTxnError(StatusCodes.TransactionNotConfirmed, 'Transaction expired before it landed', { txnHash });
      return { status: TxnStatus.error, txnHash, error };
    }
    return { status: outcome ?? TxnStatus.mining, txnHash };
  },
};
