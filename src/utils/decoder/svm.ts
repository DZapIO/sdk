import { clusterApiUrl, Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
import { solanaNativeToken, solanaWNativeToken } from '../../constants/address';
import { DecodeTransactionParameters, DecodeTransactionReturnType, TokenAmount } from '../../types/decoder';

// an rpc node can take a moment to serve a transaction the client already saw confirmed
const SVM_TX_LOOKUP_ATTEMPTS = 6;
const SVM_TX_LOOKUP_BASE_DELAY_MS = 500;

const getConfirmedTransaction = async (connection: Connection, txHash: string, attempt = 1): Promise<ParsedTransactionWithMeta> => {
  // read at confirmed, as finalized lags the confirmation the client decodes after by several seconds
  const tx = await connection.getParsedTransaction(txHash, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  if (tx) {
    return tx;
  }
  if (attempt >= SVM_TX_LOOKUP_ATTEMPTS) {
    throw new Error(`transaction ${txHash} not found after ${attempt} attempts`);
  }
  await new Promise((resolve) => setTimeout(resolve, SVM_TX_LOOKUP_BASE_DELAY_MS * 2 ** (attempt - 1)));
  return getConfirmedTransaction(connection, txHash, attempt + 1);
};

export const decodeSvmTransaction = async ({ txHash, rpcUrls }: DecodeTransactionParameters): DecodeTransactionReturnType => {
  const connection = new Connection(rpcUrls?.[0] || clusterApiUrl('mainnet-beta'));
  const tx = await getConfirmedTransaction(connection, txHash);
  const meta = tx?.meta;
  const owner = tx?.transaction?.message?.accountKeys?.[0]?.pubkey?.toBase58();
  if (!meta || !owner) {
    return undefined;
  }

  const preTokenBalances = meta.preTokenBalances ?? [];
  const postTokenBalances = meta.postTokenBalances ?? [];
  const preBalances = meta.preBalances ?? [];
  const postBalances = meta.postBalances ?? [];

  const deltas = new Map<string, bigint>();
  const addDelta = (token: string, delta: bigint) => deltas.set(token, (deltas.get(token) ?? BigInt(0)) + delta);

  // rent the signer pays to open a token account, or gets back when one is closed, moves lamports
  // without anything being traded. a wrapped sol account also carries the wrapped lamports
  // themselves, which are traded and are already counted as a token movement.
  let rentAdjustment = BigInt(0);
  const rentOf = (accountIndex: number, wrappedDelta: bigint) =>
    BigInt(postBalances[accountIndex] ?? 0) - BigInt(preBalances[accountIndex] ?? 0) - wrappedDelta;
  const wrappedPart = (mint: string, delta: bigint) => (mint === solanaWNativeToken ? delta : BigInt(0));

  postTokenBalances
    .filter((balance) => balance.owner === owner)
    .forEach((post) => {
      const pre = preTokenBalances.find((item) => item.accountIndex === post.accountIndex);
      const delta = BigInt(post.uiTokenAmount.amount) - BigInt(pre?.uiTokenAmount.amount ?? '0');
      addDelta(post.mint, delta);
      if (!pre) {
        rentAdjustment += rentOf(post.accountIndex, wrappedPart(post.mint, delta));
      }
    });
  preTokenBalances
    .filter((balance) => balance.owner === owner && !postTokenBalances.some((post) => post.accountIndex === balance.accountIndex))
    .forEach((pre) => {
      const delta = -BigInt(pre.uiTokenAmount.amount);
      addDelta(pre.mint, delta);
      rentAdjustment += rentOf(pre.accountIndex, wrappedPart(pre.mint, delta));
    });

  // lamports and wSOL are reported as the separate movements they are rather than as one asset, so
  // that trading one for the other reads as a trade instead of cancelling itself out
  const nativeDelta = BigInt(postBalances[0] ?? 0) - BigInt(preBalances[0] ?? 0) + BigInt(meta.fee ?? 0) + rentAdjustment;
  addDelta(solanaNativeToken, nativeDelta);

  const sent: TokenAmount[] = [];
  const received: TokenAmount[] = [];
  deltas.forEach((amount, token) => {
    if (amount < BigInt(0)) {
      sent.push({ token, amount: -amount });
    } else if (amount > BigInt(0)) {
      received.push({ token, amount });
    }
  });

  if (sent.length === 0 && received.length === 0) {
    return undefined;
  }
  return { sent, received };
};
