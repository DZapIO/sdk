import { encodeFunctionData, toFunctionSelector } from 'viem';
import { config } from '../../src/config';
import { exclusiveChainIds } from '../../src/constants/chains';
import { solanaNativeToken, solanaWNativeToken } from '../../src/constants/address';
import { HexString, SwapInfo } from '../../src/types';
import * as utils from '../../src/utils';
import { patchSwapAmountsFromTx } from '../../src/utils/decoder/swap';
import { SwapAbisByFunctionName } from '../../src/utils/decoder/swap/abis';

jest.mock('../../src/utils/decoder/svm', () => ({ decodeSvmTransaction: jest.fn() }));
jest.mock('../../src/utils/decoder/suivm', () => ({ decodeSuivmTransaction: jest.fn() }));

import { decodeSuivmTransaction } from '../../src/utils/decoder/suivm';
import { decodeSvmTransaction } from '../../src/utils/decoder/svm';

const decodeSvm = decodeSvmTransaction as jest.Mock;
const decodeSuivm = decodeSuivmTransaction as jest.Mock;

const USDC: HexString = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const WETH: HexString = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const ARBITRUM = 42161;
const TX_HASH: HexString = `0x${'ab'.repeat(32)}`;
const account: HexString = '0x99BCEBf44433E901597D9fCb16E799a4847519f6';

const swapData = { recipient: account, from: USDC, to: WETH, fromAmount: BigInt(1000), minToAmount: BigInt(900) };
const executionData = { dex: 'someDex', callTo: account, approveTo: account, swapCallData: '0x' as HexString, isDirectTransfer: false };

const multiSwapCalldata = (inputTokens: { token: HexString; amount: bigint }[]) =>
  encodeFunctionData({
    abi: SwapAbisByFunctionName.MultiSwapAbi,
    args: [
      `0x${'11'.repeat(32)}` as HexString,
      '0x',
      '0x',
      BigInt(0),
      inputTokens.map(({ token, amount }) => ({ token, amount, permit: '0x' as HexString })),
      [swapData],
      [executionData],
      false,
    ],
  });

const quoted = (overrides: Partial<SwapInfo> = {}): SwapInfo => ({
  dex: 'someDex',
  fromToken: USDC,
  fromAmount: BigInt(1_000_000),
  toToken: WETH,
  returnToAmount: BigInt(500),
  ...overrides,
});

// stands in for the rpc the evm decoder reads the transaction's calldata from
const serveEvmTransaction = (input: HexString) => {
  const getTransaction = jest.fn().mockResolvedValue({ input });
  const getPublicClient = jest.spyOn(utils, 'getPublicClient').mockReturnValue({ getTransaction } as never);
  return { getPublicClient, getTransaction };
};

describe('swap decoding', () => {
  beforeEach(() => {
    decodeSvm.mockReset();
    decodeSuivm.mockReset();
    jest.restoreAllMocks();
    config.setRpcUrlsByChainId({});
  });

  it('keeps the registered evm selectors in sync with the abis', () => {
    const selectorOf = (abi: (typeof SwapAbisByFunctionName)[keyof typeof SwapAbisByFunctionName]) => toFunctionSelector(abi[0] as never);

    expect(selectorOf(SwapAbisByFunctionName.SingleSwap)).toBe('0x50d52584');
    expect(selectorOf(SwapAbisByFunctionName.MultiSwapAbi)).toBe('0x8de34776');
    expect(selectorOf(SwapAbisByFunctionName.BatchPermitSwapAbi)).toBe('0x8d44ea24');
    expect(selectorOf(SwapAbisByFunctionName.GaslessExecuteMultiSwapAbi)).toBe('0xd367ada5');
    expect(selectorOf(SwapAbisByFunctionName.GaslessExecuteMultiSwapWithWitnessAbi)).toBe('0xdcdc6089');
    expect(selectorOf(SwapAbisByFunctionName.GaslessExecuteSwapAbi)).toBe('0x0d2eedd4');
  });

  it('takes the sent amount of each swap from the calldata of the evm transaction', async () => {
    const { getPublicClient, getTransaction } = serveEvmTransaction(
      multiSwapCalldata([
        { token: USDC, amount: BigInt(999_000) },
        { token: WETH, amount: BigInt(5_000) },
      ]),
    );

    const result = await patchSwapAmountsFromTx({
      chainType: 'evm',
      chainId: ARBITRUM,
      txHash: TX_HASH,
      rpcUrls: ['https://arbitrum.example'],
      eventSwapInfo: [quoted(), quoted({ fromToken: WETH, fromAmount: BigInt(7) })],
    });

    expect(getPublicClient).toHaveBeenCalledWith({ chainId: ARBITRUM, rpcUrls: ['https://arbitrum.example'] });
    expect(getTransaction).toHaveBeenCalledWith({ hash: TX_HASH });
    // the received amount comes from the event, so only the sent amounts change
    expect(result).toEqual({
      swapInfo: [quoted({ fromAmount: BigInt(999_000) }), quoted({ fromToken: WETH, fromAmount: BigInt(5_000) })],
      isAmountPatched: true,
    });
  });

  it('reads the transaction through the rpc urls configured for its chain when none are given', async () => {
    const { getPublicClient } = serveEvmTransaction(multiSwapCalldata([{ token: USDC, amount: BigInt(999_000) }]));
    config.setRpcUrlsByChainId({ [ARBITRUM]: ['https://configured.example'] });

    await patchSwapAmountsFromTx({ chainType: 'evm', chainId: ARBITRUM, txHash: TX_HASH, eventSwapInfo: quoted() });

    expect(getPublicClient).toHaveBeenCalledWith({ chainId: ARBITRUM, rpcUrls: ['https://configured.example'] });
  });

  it('adds up the deposits of a token the evm transaction made more than once', async () => {
    serveEvmTransaction(
      multiSwapCalldata([
        { token: USDC, amount: BigInt(600_000) },
        { token: USDC, amount: BigInt(400_000) },
      ]),
    );

    const result = await patchSwapAmountsFromTx({
      chainType: 'evm',
      chainId: ARBITRUM,
      txHash: TX_HASH,
      eventSwapInfo: quoted({ fromAmount: BigInt(1) }),
    });

    expect(result.swapInfo).toEqual(quoted({ fromAmount: BigInt(1_000_000) }));
  });

  it('keeps the amounts of swaps that share a token, as the transaction only moved their total', async () => {
    decodeSvm.mockResolvedValue({
      sent: [{ token: SOLANA_USDC, amount: BigInt(300_000_000) }],
      received: [
        { token: solanaNativeToken, amount: BigInt(2_000_000_000) },
        { token: solanaWNativeToken, amount: BigInt(1_000_000_000) },
      ],
    });
    const eventSwapInfo = [
      quoted({ fromToken: SOLANA_USDC, fromAmount: BigInt(100_000_000), toToken: solanaNativeToken, returnToAmount: BigInt(1) }),
      quoted({ fromToken: SOLANA_USDC, fromAmount: BigInt(200_000_000), toToken: solanaWNativeToken, returnToAmount: BigInt(2) }),
    ];

    const result = await patchSwapAmountsFromTx({ chainType: 'svm', chainId: exclusiveChainIds.solana, txHash: 'signature', eventSwapInfo });

    expect(result.swapInfo).toEqual([
      { ...eventSwapInfo[0], returnToAmount: BigInt(2_000_000_000) },
      { ...eventSwapInfo[1], returnToAmount: BigInt(1_000_000_000) },
    ]);
  });

  it('takes both amounts from the transaction on chains decoded by balance changes', async () => {
    decodeSvm.mockResolvedValue({
      sent: [{ token: SOLANA_USDC, amount: BigInt(150_000_000) }],
      received: [{ token: solanaNativeToken, amount: BigInt(2_000_000_000) }],
    });

    const result = await patchSwapAmountsFromTx({
      chainType: 'svm',
      chainId: exclusiveChainIds.solana,
      txHash: 'signature',
      rpcUrls: ['https://solana.example'],
      eventSwapInfo: quoted({ fromToken: SOLANA_USDC, toToken: solanaNativeToken, returnToAmount: BigInt(1_950_000_000) }),
    });

    expect(decodeSvm).toHaveBeenCalledWith({ txHash: 'signature', chainId: exclusiveChainIds.solana, rpcUrls: ['https://solana.example'] });
    expect(result.swapInfo).toEqual(
      quoted({
        fromToken: SOLANA_USDC,
        fromAmount: BigInt(150_000_000),
        toToken: solanaNativeToken,
        returnToAmount: BigInt(2_000_000_000),
      }),
    );
  });

  it('tells sol and wrapped sol apart when they are the two sides of the swap', async () => {
    decodeSvm.mockResolvedValue({
      sent: [{ token: solanaWNativeToken, amount: BigInt(10_054_032) }],
      received: [{ token: solanaNativeToken, amount: BigInt(10_054_032) }],
    });

    const result = await patchSwapAmountsFromTx({
      chainType: 'svm',
      chainId: exclusiveChainIds.solana,
      txHash: 'signature',
      eventSwapInfo: quoted({ fromToken: solanaWNativeToken, fromAmount: BigInt(0), toToken: solanaNativeToken, returnToAmount: BigInt(0) }),
    });

    expect(result.swapInfo).toEqual(
      quoted({
        fromToken: solanaWNativeToken,
        fromAmount: BigInt(10_054_032),
        toToken: solanaNativeToken,
        returnToAmount: BigInt(10_054_032),
      }),
    );
  });

  it('routes sui chains to their own decoder', async () => {
    decodeSuivm.mockResolvedValue({ sent: [], received: [] });

    await patchSwapAmountsFromTx({ chainType: 'suivm', chainId: exclusiveChainIds.sui, txHash: 'digest', eventSwapInfo: quoted() });

    expect(decodeSuivm).toHaveBeenCalledWith({ txHash: 'digest', chainId: exclusiveChainIds.sui, rpcUrls: undefined });
    expect(decodeSvm).not.toHaveBeenCalled();
  });

  it('falls back to the quoted swap info when nothing can be decoded, and says why', async () => {
    const eventSwapInfo = quoted();

    serveEvmTransaction('0xdeadbeef');
    expect(await patchSwapAmountsFromTx({ chainType: 'evm', chainId: ARBITRUM, txHash: TX_HASH, eventSwapInfo })).toEqual({
      swapInfo: eventSwapInfo,
      isAmountPatched: false,
      amountPatchError: `no token amounts could be decoded from transaction ${TX_HASH}`,
    });
    expect(await patchSwapAmountsFromTx({ chainType: 'tonvm', chainId: exclusiveChainIds.ton, txHash: 'hash', eventSwapInfo })).toEqual({
      swapInfo: eventSwapInfo,
      isAmountPatched: false,
      amountPatchError: 'decoding tonvm transactions is not supported',
    });

    decodeSvm.mockRejectedValue(new Error('transaction signature not found after 6 attempts'));
    expect(await patchSwapAmountsFromTx({ chainType: 'svm', chainId: exclusiveChainIds.solana, txHash: 'signature', eventSwapInfo })).toEqual({
      swapInfo: eventSwapInfo,
      isAmountPatched: false,
      amountPatchError: 'transaction signature not found after 6 attempts',
    });
  });

  it('says the amounts were not patched when none of the transaction tokens is a swap token', async () => {
    decodeSvm.mockResolvedValue({ sent: [{ token: SOLANA_USDC, amount: BigInt(150_000) }], received: [] });
    const eventSwapInfo = quoted();

    const result = await patchSwapAmountsFromTx({ chainType: 'svm', chainId: exclusiveChainIds.solana, txHash: 'signature', eventSwapInfo });

    expect(result).toEqual({
      swapInfo: eventSwapInfo,
      isAmountPatched: false,
      amountPatchError: 'no token amount of the transaction matched a swap token',
    });
  });
});
