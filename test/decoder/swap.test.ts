import { encodeFunctionData, toFunctionSelector } from 'viem';
import { solanaNativeToken, solanaWNativeToken } from '../../src/constants/address';
import { Chain, HexString, SwapInfo } from '../../src/types';
import { handleDecodeNonEvmSwapData } from '../../src/utils';
import { SwapAbisByFunctionName } from '../../src/utils/decoder/swap/abis';
import { updateSwapInfo } from '../../src/utils/decoder/swap/inputDataDecoder';

jest.mock('../../src/utils/decoder/swap/svm', () => ({ decodeSvmSwapAmounts: jest.fn() }));
jest.mock('../../src/utils/decoder/swap/suivm', () => ({ decodeSuivmSwapAmounts: jest.fn() }));

import { decodeSuivmSwapAmounts } from '../../src/utils/decoder/swap/suivm';
import { decodeSvmSwapAmounts } from '../../src/utils/decoder/swap/svm';

const decodeSvm = decodeSvmSwapAmounts as jest.Mock;
const decodeSuivm = decodeSuivmSwapAmounts as jest.Mock;

const USDC: HexString = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const WETH: HexString = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
const SOLANA_USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOLANA_CHAIN_ID = 7565164;
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

const solanaChain = { chainId: SOLANA_CHAIN_ID, chainType: 'svm', nativeToken: { contract: solanaNativeToken } } as Chain;

describe('swap decoding', () => {
  beforeEach(() => {
    decodeSvm.mockReset();
    decodeSuivm.mockReset();
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

  it('takes the sent amount of each swap from the evm calldata', async () => {
    const data = multiSwapCalldata([
      { token: USDC, amount: BigInt(999_000) },
      { token: WETH, amount: BigInt(5_000) },
    ]);

    const result = await updateSwapInfo({
      chainType: 'evm',
      data,
      eventSwapInfo: [quoted(), quoted({ fromToken: WETH, fromAmount: BigInt(7) })],
    });

    // the received amount comes from the event, so only the sent amounts change
    expect(result).toEqual([quoted({ fromAmount: BigInt(999_000) }), quoted({ fromToken: WETH, fromAmount: BigInt(5_000) })]);
  });

  it('takes both amounts from the transaction on chains decoded by balance changes', async () => {
    decodeSvm.mockResolvedValue({
      input: [{ token: SOLANA_USDC, amount: BigInt(150_000_000) }],
      output: [{ token: solanaNativeToken, amount: BigInt(2_000_000_000) }],
    });

    const result = await updateSwapInfo({
      chainType: 'svm',
      txHash: 'signature',
      rpcUrls: ['https://solana.example'],
      eventSwapInfo: quoted({ fromToken: SOLANA_USDC, toToken: solanaNativeToken, returnToAmount: BigInt(1_950_000_000) }),
    });

    expect(decodeSvm).toHaveBeenCalledWith({ data: undefined, txHash: 'signature', rpcUrls: ['https://solana.example'] });
    expect(result).toEqual(
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
      input: [{ token: solanaWNativeToken, amount: BigInt(10_054_032) }],
      output: [{ token: solanaNativeToken, amount: BigInt(10_054_032) }],
    });

    const result = await updateSwapInfo({
      chainType: 'svm',
      txHash: 'signature',
      eventSwapInfo: quoted({ fromToken: solanaWNativeToken, fromAmount: BigInt(0), toToken: solanaNativeToken, returnToAmount: BigInt(0) }),
    });

    expect(result).toEqual(
      quoted({
        fromToken: solanaWNativeToken,
        fromAmount: BigInt(10_054_032),
        toToken: solanaNativeToken,
        returnToAmount: BigInt(10_054_032),
      }),
    );
  });

  it('routes sui chains to their own decoder', async () => {
    decodeSuivm.mockResolvedValue({ input: [], output: [] });

    await updateSwapInfo({ chainType: 'suivm', txHash: 'digest', eventSwapInfo: quoted() });

    expect(decodeSuivm).toHaveBeenCalledWith({ data: undefined, txHash: 'digest', rpcUrls: undefined });
    expect(decodeSvm).not.toHaveBeenCalled();
  });

  it('falls back to the quoted swap info when nothing can be decoded', async () => {
    const eventSwapInfo = quoted();

    expect(await updateSwapInfo({ chainType: 'evm', data: '0xdeadbeef', eventSwapInfo })).toEqual(eventSwapInfo);
    expect(await updateSwapInfo({ chainType: 'tonvm', txHash: 'hash', eventSwapInfo })).toEqual(eventSwapInfo);

    decodeSvm.mockRejectedValue(new Error('rpc is down'));
    expect(await updateSwapInfo({ chainType: 'svm', txHash: 'signature', eventSwapInfo })).toEqual(eventSwapInfo);
  });

  it('reports a pair as failed only when the transaction received nothing for it', async () => {
    decodeSvm.mockResolvedValue({ input: [{ token: SOLANA_USDC, amount: BigInt(150_000_000) }], output: [] });
    const nothingReceived = await handleDecodeNonEvmSwapData({
      txHash: 'signature',
      eventSwapInfo: quoted({ fromToken: SOLANA_USDC, toToken: solanaNativeToken, returnToAmount: BigInt(0) }),
      chain: solanaChain,
    });

    decodeSvm.mockResolvedValue({
      input: [{ token: SOLANA_USDC, amount: BigInt(150_000_000) }],
      output: [{ token: solanaNativeToken, amount: BigInt(2_000_000_000) }],
    });
    const received = await handleDecodeNonEvmSwapData({
      txHash: 'signature',
      eventSwapInfo: quoted({ fromToken: SOLANA_USDC, toToken: solanaNativeToken, returnToAmount: BigInt(0) }),
      chain: solanaChain,
    });

    expect(nothingReceived.swapFailPairs).toEqual([`${SOLANA_CHAIN_ID}_${SOLANA_USDC}-${SOLANA_CHAIN_ID}_${solanaNativeToken}`]);
    // the quote said zero but the transaction did deliver, so the pair is not a failure
    expect(received.swapFailPairs).toEqual([]);
    expect((received.swapInfo as SwapInfo).returnToAmount).toBe(BigInt(2_000_000_000));
  });
});
