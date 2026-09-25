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

const getConnection = (rpcUrls?: string[]) => new Connection(rpcUrls?.[0] || clusterApiUrl('mainnet-beta'), 'confirmed');

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
 * Polls a signature until it settles at the commitment or the timeout runs out. `onPending` runs after
 * every poll that did not settle it, and learns whether the tx has been seen on chain yet.
 */
const pollSignature = async ({
  connection,
  signature,
  commitment,
  timeoutMs = CONFIRMATION_TIMEOUT_MS,
  onPending,
}: {
  connection: Connection;
  signature: string;
  commitment: Finality;
  timeoutMs?: number;
  onPending?: (seen: boolean) => Promise<void>;
}): Promise<SignatureOutcome> => {
  const poll = async () => {
    const { value } = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
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
    }
    await onPending?.(seen);
  }
  // one last look, as the tx may have settled during the final wait
  return (await poll().catch(() => undefined))?.outcome;
};

const assertSettled = (outcome: SignatureOutcome, txnHash: string) => {
  if (outcome === TxnStatus.reverted) {
    throw new DZapTxnError(StatusCodes.ContractExecutionError, 'Transaction failed on chain', { txnHash });
  }
  if (outcome !== TxnStatus.success) {
    throw new DZapTxnError(StatusCodes.TransactionNotConfirmed, 'Transaction was not confirmed in time', { txnHash });
  }
  return { txnHash };
};

/**
 * Sets the blockhash of txs to a fresh one, so that they do not expire while the user signs. A given
 * blockhash is kept, as the api already signed part of the tx over it.
 */
const withBlockhash = async (connection: Connection, txs: VersionedTransaction[], given?: Blockhash): Promise<number> => {
  const { blockhash, lastValidBlockHeight } =
    given?.blockhash && given.lastValidBlockHeight ? (given as Required<Blockhash>) : await connection.getLatestBlockhash('confirmed');
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
 * Sends a tx to the rpc and resends it on every poll until it lands, as rpc nodes drop txs that do not
 * land right away. It is given up on once its blockhash expired.
 */
const sendToRpc = async (connection: Connection, signedTx: VersionedTransaction, lastValidBlockHeight: number, commitment: Finality) => {
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, SEND_OPTIONS);

  let lastBlockhashCheck = Date.now();
  const outcome = await pollSignature({
    connection,
    signature,
    commitment,
    onPending: async (seen) => {
      if (seen) return;
      connection.sendRawTransaction(rawTx, SEND_OPTIONS).catch((error) => console.warn('Failed to resend transaction', error));
      if (Date.now() - lastBlockhashCheck < BLOCKHASH_CHECK_INTERVAL_MS) return;
      lastBlockhashCheck = Date.now();
      const blockHeight = await connection.getBlockHeight('confirmed').catch(() => undefined);
      if (blockHeight !== undefined && blockHeight > lastValidBlockHeight) {
        throw new DZapTxnError(StatusCodes.TransactionNotConfirmed, 'Transaction expired before it landed', { txnHash: signature });
      }
    },
  });
  return assertSettled(outcome, signature);
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
  commitment,
}: {
  chainId: number;
  signer: SvmSigner;
  data: string[];
  blockhash?: Blockhash;
  broadcastViaProvider?: boolean;
  txId?: string;
  rpcUrls?: string[];
  commitment: Finality;
}) => {
  if (!data.length) {
    throw new DZapTxnError(StatusCodes.InvalidRequest, 'No Solana transaction to send');
  }
  const connection = getConnection(rpcUrls);
  const txs = data.map(deserialize);
  // a third party's signature is over the blockhash the tx was built with, so it is left as is
  const lastValidBlockHeight = broadcastViaProvider ? undefined : await withBlockhash(connection, txs, blockhash);
  const signedTxs = await signAll(signer, txs);

  if (lastValidBlockHeight !== undefined && signedTxs.length === 1) {
    return sendToRpc(connection, signedTxs[0], lastValidBlockHeight, commitment);
  }
  const txnHash = broadcastViaProvider ? await sendThroughApi({ chainId, txId, signedTx: signedTxs[0] }) : await sendJitoBundle(chainId, signedTxs);
  return assertSettled(await pollSignature({ connection, signature: txnHash, commitment }), txnHash);
};

export const svmAdapter: ChainAdapter<SvmSigner> = {
  isSigner: (signer): signer is SvmSigner => !isEvmSigner(signer) && typeof (signer as SvmSigner).signTransaction === 'function',

  sendTrade: ({ chainId, signer, txnData, rpcUrls }) =>
    send({
      chainId,
      signer,
      data: toTxList(txnData.data),
      blockhash: txnData.svmTxData,
      broadcastViaProvider: txnData.broadcastViaProvider,
      txId: txnData.txId,
      rpcUrls,
      commitment: 'confirmed',
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
      commitment: 'confirmed',
    });
  },

  // the zap api reads the result of a step once it is final
  sendZapStep: ({ chainId, signer, step, rpcUrls }) => {
    const { data, blockhash } = step as SVMTxnDetails;
    return send({ chainId, signer, data, blockhash, rpcUrls, commitment: 'finalized' });
  },

  waitForTransaction: async ({ txnHash, rpcUrls, timeoutMs }) => {
    const outcome = await pollSignature({ connection: getConnection(rpcUrls), signature: txnHash, commitment: 'confirmed', timeoutMs });
    return { status: outcome ?? TxnStatus.mining, txnHash };
  },
};
