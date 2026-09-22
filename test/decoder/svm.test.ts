import { Connection } from '@solana/web3.js';
import { exclusiveChainIds } from '../../src/constants/chains';
import { decodeSvmTransaction } from '../../src/utils/decoder/svm';

const OWNER = 'Owner11111111111111111111111111111111111111';
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

// a swap of 150000 USDC for 149999 USDT paid for by its owner
const swapTransaction = {
  transaction: { message: { accountKeys: [{ pubkey: { toBase58: () => OWNER } }] } },
  meta: {
    fee: 5000,
    preBalances: [1_000_000],
    postBalances: [995_000],
    preTokenBalances: [
      { accountIndex: 1, mint: USDC, owner: OWNER, uiTokenAmount: { amount: '150000' } },
      { accountIndex: 2, mint: USDT, owner: OWNER, uiTokenAmount: { amount: '0' } },
    ],
    postTokenBalances: [
      { accountIndex: 1, mint: USDC, owner: OWNER, uiTokenAmount: { amount: '0' } },
      { accountIndex: 2, mint: USDT, owner: OWNER, uiTokenAmount: { amount: '149999' } },
    ],
  },
};

// how many times the decoder looks the transaction up before giving up
const SVM_TX_LOOKUP_ATTEMPTS = 6;

const decode = () => decodeSvmTransaction({ txHash: 'signature', chainId: exclusiveChainIds.solana, rpcUrls: ['https://solana.example'] });

describe('solana transaction decoding', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reads the transaction at confirmed and waits for an rpc that does not serve it yet', async () => {
    const getParsedTransaction = jest
      .spyOn(Connection.prototype, 'getParsedTransaction')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(swapTransaction as never);

    const decoded = decode();
    await jest.runAllTimersAsync();

    expect(await decoded).toEqual({
      sent: [{ token: USDC, amount: BigInt(150_000) }],
      received: [{ token: USDT, amount: BigInt(149_999) }],
    });
    expect(getParsedTransaction).toHaveBeenCalledTimes(3);
    expect(getParsedTransaction).toHaveBeenCalledWith('signature', { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  });

  it('gives up on a transaction the rpc never serves', async () => {
    const getParsedTransaction = jest.spyOn(Connection.prototype, 'getParsedTransaction').mockResolvedValue(null);

    const decoded = decode();
    const rejection = expect(decoded).rejects.toThrow(`transaction signature not found after ${SVM_TX_LOOKUP_ATTEMPTS} attempts`);
    await jest.runAllTimersAsync();

    await rejection;
    expect(getParsedTransaction).toHaveBeenCalledTimes(SVM_TX_LOOKUP_ATTEMPTS);
  });
});
