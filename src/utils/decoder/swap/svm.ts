import { clusterApiUrl, Connection } from '@solana/web3.js';
import { solanaNativeToken, solanaWNativeToken } from '../../../constants/address';
import { SwapAmountDecodeResult, TokenAmount } from './types';

export const decodeSvmSwapAmounts = async ({
  txHash,
  rpcUrls,
}: {
  txHash?: string;
  rpcUrls?: string[];
}): Promise<SwapAmountDecodeResult | undefined> => {
  if (!txHash) {
    return undefined;
  }
  const connection = new Connection(rpcUrls?.[0] || clusterApiUrl('mainnet-beta'));
  const tx = await connection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
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
  // without being part of the swap. a wrapped sol account also carries the wrapped lamports
  // themselves, which are the swap and are already counted as a token movement.
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

  // lamports and wSOL are reported as the movements they are rather than as one asset, so that a
  // swap between the two reads as a swap instead of cancelling itself out
  const nativeDelta = BigInt(postBalances[0] ?? 0) - BigInt(preBalances[0] ?? 0) + BigInt(meta.fee ?? 0) + rentAdjustment;
  addDelta(solanaNativeToken, nativeDelta);

  const input: TokenAmount[] = [];
  const output: TokenAmount[] = [];
  deltas.forEach((amount, token) => {
    if (amount < BigInt(0)) {
      input.push({ token, amount: -amount });
    } else if (amount > BigInt(0)) {
      output.push({ token, amount });
    }
  });

  if (input.length === 0 && output.length === 0) {
    return undefined;
  }
  return { input, output };
};
