import { encodeAbiParameters, encodeEventTopics, TransactionReceipt, zeroAddress } from 'viem';
import { dZapCoreAbi } from '../../src/artifacts';
import { solanaNativeToken } from '../../src/constants/address';
import { exclusiveChainIds } from '../../src/constants/chains';
import { Chain, HexString, SwapInfo } from '../../src/types';
import { ChainType } from '../../src/types/chains';
import { DecodeTxnDataParams } from '../../src/types/decoder';
import * as utils from '../../src/utils';
import { decodeTxnData } from '../../src/utils/decoder';

jest.mock('../../src/utils/decoder/swap', () => ({ patchSwapAmountsFromTx: jest.fn() }));

import { patchSwapAmountsFromTx } from '../../src/utils/decoder/swap';

const patchSwapAmounts = patchSwapAmountsFromTx as jest.Mock;

const USDC: HexString = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const WETH: HexString = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const ARBITRUM = 42161;
const TX_HASH: HexString = `0x${'ab'.repeat(32)}`;
const account: HexString = '0x99BCEBf44433E901597D9fCb16E799a4847519f6';

// the chainType is kept as a literal so each chain lands on its own arm of DecodeTxnDataParams
const chainOf = <T extends ChainType>(chainId: number, chainType: T) =>
  ({ chainId, chainType, nativeToken: { contract: zeroAddress } }) as unknown as Chain & { chainType: T };
const arbitrum = chainOf(ARBITRUM, 'evm');
const solana = chainOf(exclusiveChainIds.solana, 'svm');

const quoted = (overrides: Partial<SwapInfo> = {}): SwapInfo => ({
  dex: 'someDex',
  fromToken: USDC,
  fromAmount: BigInt(1_000_000),
  toToken: WETH,
  returnToAmount: BigInt(500),
  ...overrides,
});

// the swap info the dZap contract emits, which also carries who it called and paid
const emitted = (overrides: Partial<SwapInfo> = {}) => ({ ...quoted(overrides), callTo: account, recipient: account });

// a receipt carrying the DZapTokenSwapped event the dZap contract emits for a single swap
const swapReceipt = (swapInfo: SwapInfo): TransactionReceipt => {
  const event = dZapCoreAbi.find((item) => item.type === 'event' && item.name === 'DZapTokenSwapped');
  const topics = encodeEventTopics({ abi: dZapCoreAbi, eventName: 'DZapTokenSwapped', args: { transactionId: '0x01', sender: account } } as never);
  const data = encodeAbiParameters(
    [(event as { inputs: readonly { indexed?: boolean }[] }).inputs.find((input) => !input.indexed)] as never,
    [swapInfo] as never,
  );
  return { transactionHash: TX_HASH, logs: [{ address: account, topics, data }] } as unknown as TransactionReceipt;
};

describe('transaction decoding', () => {
  beforeEach(() => {
    patchSwapAmounts.mockReset();
    jest.restoreAllMocks();
  });

  it('reads the swap info of an evm transaction from its receipt and patches it with the actual amounts', async () => {
    patchSwapAmounts.mockImplementation(async ({ eventSwapInfo }) => ({
      swapInfo: { ...eventSwapInfo, fromAmount: BigInt(999_000) },
      isAmountPatched: true,
    }));

    const result = await decodeTxnData({ service: 'trade', chain: arbitrum, receipt: swapReceipt(emitted()), rpcUrls: ['https://arbitrum.example'] });

    expect(patchSwapAmounts).toHaveBeenCalledWith({
      chainType: 'evm',
      chainId: ARBITRUM,
      txHash: TX_HASH,
      rpcUrls: ['https://arbitrum.example'],
      eventSwapInfo: emitted(),
    });
    expect(result).toEqual({ swapInfo: emitted({ fromAmount: BigInt(999_000) }), isAmountPatched: true, swapFailPairs: [] });
  });

  it('fetches the receipt of an evm transaction when only its hash is given', async () => {
    patchSwapAmounts.mockImplementation(async ({ eventSwapInfo }) => ({
      swapInfo: eventSwapInfo,
      isAmountPatched: false,
      amountPatchError: 'rpc is down',
    }));
    const getTransactionReceipt = jest.fn().mockResolvedValue(swapReceipt(emitted()));
    const getPublicClient = jest.spyOn(utils, 'getPublicClient').mockReturnValue({ getTransactionReceipt } as never);

    const result = await decodeTxnData({ service: 'trade', chain: arbitrum, txHash: TX_HASH });

    expect(getPublicClient).toHaveBeenCalledWith({ chainId: ARBITRUM, rpcUrls: undefined });
    expect(getTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH });
    expect(result).toEqual({ swapInfo: emitted(), isAmountPatched: false, amountPatchError: 'rpc is down', swapFailPairs: [] });
  });

  it('patches the given swap info of a transaction on a chain without dZap events', async () => {
    const eventSwapInfo = quoted({ fromToken: SOLANA_USDC, toToken: solanaNativeToken });
    patchSwapAmounts.mockResolvedValue({
      swapInfo: { ...eventSwapInfo, fromAmount: BigInt(150_000_000), returnToAmount: BigInt(2_000_000_000) },
      isAmountPatched: true,
    });

    const result = await decodeTxnData({ service: 'trade', chain: solana, txHash: 'signature', eventSwapInfo });

    expect(patchSwapAmounts).toHaveBeenCalledWith({
      chainType: 'svm',
      chainId: exclusiveChainIds.solana,
      txHash: 'signature',
      rpcUrls: undefined,
      eventSwapInfo,
    });
    expect(result).toEqual({
      swapInfo: { ...eventSwapInfo, fromAmount: BigInt(150_000_000), returnToAmount: BigInt(2_000_000_000) },
      isAmountPatched: true,
      swapFailPairs: [],
    });
  });

  it('reports the pair of a swap that gave nothing back as failed, going by the actual amounts', async () => {
    const eventSwapInfo = [quoted({ fromToken: SOLANA_USDC, toToken: solanaNativeToken }), quoted()];
    patchSwapAmounts.mockResolvedValue({ swapInfo: [eventSwapInfo[0], { ...eventSwapInfo[1], returnToAmount: BigInt(0) }], isAmountPatched: true });

    const { swapFailPairs } = await decodeTxnData({ service: 'trade', chain: solana, txHash: 'signature', eventSwapInfo });

    expect(swapFailPairs).toEqual([`${exclusiveChainIds.solana}_${USDC}-${exclusiveChainIds.solana}_${WETH}`]);
  });

  it('does not report a swap that gave something back as failed, whatever it took in', async () => {
    const eventSwapInfo = quoted({ fromToken: SOLANA_USDC, toToken: solanaNativeToken, fromAmount: BigInt(0) });
    patchSwapAmounts.mockResolvedValue({ swapInfo: eventSwapInfo, isAmountPatched: true });

    const { swapFailPairs } = await decodeTxnData({ service: 'trade', chain: solana, txHash: 'signature', eventSwapInfo });

    expect(swapFailPairs).toEqual([]);
  });

  // the types rule these calls out, so they stand in for a js caller getting it wrong
  it('asks for what it needs to find the swap info', async () => {
    await expect(decodeTxnData({ service: 'trade', chain: arbitrum } as unknown as DecodeTxnDataParams)).rejects.toThrow(
      'receipt or txHash is required',
    );
    await expect(decodeTxnData({ service: 'trade', chain: solana, txHash: 'signature' } as unknown as DecodeTxnDataParams)).rejects.toThrow(
      'txHash and eventSwapInfo are required',
    );
    expect(patchSwapAmounts).not.toHaveBeenCalled();
  });
});
