import { Connection } from '@solana/web3.js';
import axios from 'axios';
import { solanaNativeToken, solanaWNativeToken, suiNativeToken } from '../../src/constants/address';
import { exclusiveChainIds } from '../../src/constants/chains';
import { decodeSuivmTransaction } from '../../src/utils/decoder/suivm';
import { decodeSvmTransaction } from '../../src/utils/decoder/svm';

const SOLANA_RPC = ['https://api.mainnet-beta.solana.com'];
const SUI_RPC = ['https://sui-rpc.publicnode.com'];

// public nodes prune old history. only a transaction the chain no longer serves is skipped: a
// transaction that is still there but decodes to nothing, or an rpc that fails, has to fail rather than quietly pass.
const served = async (txHash: string, fetched: Promise<unknown>) => {
  const transaction = await fetched;
  if (!transaction) {
    console.warn(`Skipping ${txHash} - no longer served by the public rpc`);
  }
  return Boolean(transaction);
};

const solanaTransaction = (txHash: string) => new Connection(SOLANA_RPC[0]).getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });

const suiTransaction = async (txHash: string) => {
  const response = await axios.post(SUI_RPC[0], {
    jsonrpc: '2.0',
    id: 1,
    method: 'sui_getTransactionBlock',
    params: [txHash, { showBalanceChanges: true }],
  });
  return response.data?.result ?? null;
};

describe('swap decoding against mainnet transactions', () => {
  it('reads both sides of a solana token to token swap and no sol for the gas it paid', async () => {
    const txHash = '5M4gvaPoWM4pBr6eVgdJGCVi9WeoLyt38eDP6bXkJ7CQ2UASnduU1U8M4GS7CPXqozg2kJbrXt9pAgzBWCrQjTea';
    if (!(await served(txHash, solanaTransaction(txHash)))) return;

    const result = await decodeSvmTransaction({ txHash, chainId: exclusiveChainIds.solana, rpcUrls: SOLANA_RPC });

    expect(result?.sent).toEqual([{ token: 'H7USvkkqQT3cu7CkeBtY7w6kcE8ckSzNraxrTdR1xyJe', amount: BigInt('3051482914610') }]);
    expect(result?.received).toEqual([{ token: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S', amount: BigInt(166_624_255) }]);
  });

  it('reads sol spent by a swap that closed a wrapped sol account it already held', async () => {
    // closing that account refunded 1488440 lamports of rent to the signer, which is not part of the
    // swap: without excluding it the amount reads 117883405 instead of 119371845
    const txHash = '5TfKqcCBQ3WbD1QFMrBG27btxQoWGmJfkRgGNDnESYUFENaADWQkhvEQXLbAYQGnPgtvRgVrdGQBydVm4ZJ6mxqR';
    if (!(await served(txHash, solanaTransaction(txHash)))) return;

    const result = await decodeSvmTransaction({ txHash, chainId: exclusiveChainIds.solana, rpcUrls: SOLANA_RPC });

    expect(result?.sent).toEqual([{ token: solanaNativeToken, amount: BigInt(119_371_845) }]);
    expect(result?.received).toEqual([{ token: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: BigInt(234_885) }]);
  });

  it('reads a swap out of wrapped sol into sol as both sides of a swap', async () => {
    // lamports and wrapped sol move against each other here, so treating the two as one asset would
    // cancel the swap out to nothing
    const txHash = '2PQdnXmGq4SGdSiWyYakmnyXBwLmrRqi7PJrTgPRZAetMgtWrvWWiJQk2NvnKfRbRhh6EkiHaek76rXFvD9rnFoC';
    if (!(await served(txHash, solanaTransaction(txHash)))) return;

    const result = await decodeSvmTransaction({ txHash, chainId: exclusiveChainIds.solana, rpcUrls: SOLANA_RPC });

    expect(result?.sent).toEqual([{ token: solanaWNativeToken, amount: BigInt(10_054_032) }]);
    expect(result?.received).toEqual([{ token: solanaNativeToken, amount: BigInt(10_054_032) }]);
  });

  it('reads a swap out of sol into wrapped sol as both sides of a swap', async () => {
    // the wrapped sol account is opened by this swap, so its lamports are the rent plus the wrapped
    // sol itself: counting all of it as rent flips the sent amount into a received one
    const txHash = '3cTfHaL9zTXb8ErBXNVx7Z5CCtsQRt67FmTDGxozJrop7yVqDrALx2EdL2G3DuKPab1gWxgRVitdDzv8a5pHVrq1';
    if (!(await served(txHash, solanaTransaction(txHash)))) return;

    const result = await decodeSvmTransaction({ txHash, chainId: exclusiveChainIds.solana, rpcUrls: SOLANA_RPC });

    expect(result?.sent).toEqual([{ token: solanaNativeToken, amount: BigInt(4_588_877) }]);
    expect(result?.received).toEqual([{ token: solanaWNativeToken, amount: BigInt(4_588_877) }]);
  });

  it('reads both sides of a sui coin to coin swap and no sui for the gas it paid', async () => {
    // the sender's sui balance moved by exactly the gas, so the swap itself moved no sui
    const txHash = 'ENS55GdzTtttNNnDMZ49hx8x6BGhku1Cn2ejtRUYxgV8';
    if (!(await served(txHash, suiTransaction(txHash)))) return;

    const result = await decodeSuivmTransaction({ txHash, chainId: exclusiveChainIds.sui, rpcUrls: SUI_RPC });

    expect(result?.sent).toEqual([
      { token: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC', amount: BigInt(8_050_998) },
    ]);
    expect(result?.received).toEqual([
      { token: '0x9d297676e7a4b771ab023291377b2adfaa4938fb9080b8d12430e4b108b836a9::xaum::XAUM', amount: BigInt(1_879_773) },
    ]);
  });

  it('reads sui received by a swap without the gas rebate it earned', async () => {
    const txHash = '8SK72NNkb3ektHBvJSsAmuL92aJCsKK7hRp725idZkMX';
    if (!(await served(txHash, suiTransaction(txHash)))) return;

    const result = await decodeSuivmTransaction({ txHash, chainId: exclusiveChainIds.sui, rpcUrls: SUI_RPC });

    expect(result?.sent).toEqual([
      { token: '0x5ffe80c90a653e3ca056fd3926987bf3e8068ca21528bb4fdbc4d487cc152dad::jackson::JACKSON', amount: BigInt(146_900_000) },
    ]);
    expect(result?.received).toEqual([{ token: suiNativeToken, amount: BigInt(19_943_359) }]);
  });
});
