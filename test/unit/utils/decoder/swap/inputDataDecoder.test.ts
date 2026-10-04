import { encodeFunctionData } from 'viem';
import { SwapInputDataDecoder } from '../../../../../src/utils/decoder/swap/inputDataDecoder';
import { SwapAbisByFunctionName } from '../../../../../src/utils/decoder/swap/abis';
import type { HexString } from '../../../../../src/types';

describe('utils/decoder/swap/inputDataDecoder', () => {
  const decoder = new SwapInputDataDecoder();
  const fromToken = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as HexString;
  const toToken = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as HexString;
  const user = '0x99BCEBf44433E901597D9fCb16E799a4847519f6' as HexString;
  const txId = '0x0000000000000000000000000000000000000000000000000000000000000001' as HexString;
  const inputAmount = BigInt(500000);
  const deadline = BigInt(9999999999);

  const baseSwapInfo = {
    dex: 'uniswap',
    fromToken,
    toToken,
    fromAmount: BigInt(100),
    returnToAmount: BigInt(99),
  };

  const inputToken = { token: fromToken, amount: inputAmount, permit: '0x' as HexString };
  const swapData = {
    recipient: user,
    from: fromToken,
    to: toToken,
    fromAmount: inputAmount,
    minToAmount: BigInt(1),
  };
  const swapExecution = {
    dex: 'uniswap',
    callTo: '0x0000000000000000000000000000000000000002' as HexString,
    approveTo: '0x0000000000000000000000000000000000000003' as HexString,
    swapCallData: '0x' as HexString,
    isDirectTransfer: false,
  };

  const buildSingleSwapCalldata = () =>
    encodeFunctionData({
      abi: SwapAbisByFunctionName.SingleSwap,
      functionName: 'swap',
      args: [txId, '0x', '0x', deadline, inputToken, swapData, swapExecution],
    });

  const buildMultiSwapCalldata = (inputTokens = [inputToken]) =>
    encodeFunctionData({
      abi: SwapAbisByFunctionName.MultiSwapAbi,
      functionName: 'swap',
      args: [txId, '0x', '0x', deadline, inputTokens, [swapData], [swapExecution], false],
    });

  const buildBatchPermitSwapCalldata = () =>
    encodeFunctionData({
      abi: SwapAbisByFunctionName.BatchPermitSwapAbi,
      functionName: 'swap',
      args: [
        txId,
        '0x',
        '0x',
        deadline,
        '0x',
        {
          permitted: [{ token: fromToken, amount: inputAmount }],
          nonce: BigInt(1),
          deadline,
        },
        [swapData],
        [swapExecution],
        false,
      ],
    });

  const buildGaslessExecuteMultiSwapCalldata = () =>
    encodeFunctionData({
      abi: SwapAbisByFunctionName.GaslessExecuteMultiSwapAbi,
      functionName: 'executeMultiSwap',
      args: [txId, '0x', '0x', '0x', deadline, deadline, user, [inputToken], [{ token: fromToken, amount: BigInt(1) }], [swapData], [swapExecution]],
    });

  const buildGaslessExecuteMultiSwapWithWitnessCalldata = () =>
    encodeFunctionData({
      abi: SwapAbisByFunctionName.GaslessExecuteMultiSwapWithWitnessAbi,
      functionName: 'executeMultiSwapWithWitness',
      args: [
        txId,
        '0x',
        '0x',
        '0x',
        deadline,
        user,
        {
          permitted: [{ token: fromToken, amount: inputAmount }],
          nonce: BigInt(1),
          deadline,
        },
        [{ token: fromToken, amount: inputAmount }],
        [swapData],
        [swapExecution],
      ],
    });

  const buildGaslessExecuteSwapCalldata = () =>
    encodeFunctionData({
      abi: SwapAbisByFunctionName.GaslessExecuteSwapAbi,
      functionName: 'executeSwap',
      args: [txId, '0x', '0x', '0x', deadline, deadline, user, inputToken, { token: fromToken, amount: BigInt(1) }, swapData, swapExecution],
    });

  it('returns eventSwapInfo when data is missing', () => {
    expect(decoder.updateSwapInfo({ eventSwapInfo: baseSwapInfo })).toEqual(baseSwapInfo);
  });

  it('returns eventSwapInfo when data is 0x', () => {
    expect(decoder.updateSwapInfo({ data: '0x', eventSwapInfo: baseSwapInfo })).toEqual(baseSwapInfo);
  });

  it('returns undefined when eventSwapInfo is missing', () => {
    expect(decoder.updateSwapInfo({ data: buildSingleSwapCalldata() })).toBeUndefined();
  });

  it('returns eventSwapInfo for unknown function signature', () => {
    expect(decoder.updateSwapInfo({ data: '0xdeadbeef00', eventSwapInfo: baseSwapInfo })).toEqual(baseSwapInfo);
  });

  it('updates fromAmount from singleSwap calldata', () => {
    const data = buildSingleSwapCalldata();
    expect(data.startsWith('0x50d52584')).toBe(true);
    const updated = decoder.updateSwapInfo({ data, eventSwapInfo: baseSwapInfo });
    expect(updated).toMatchObject({ fromAmount: inputAmount });
  });

  it('updates fromAmount from multiSwap calldata', () => {
    const data = buildMultiSwapCalldata();
    expect(data.startsWith('0x8de34776')).toBe(true);
    const updated = decoder.updateSwapInfo({ data, eventSwapInfo: baseSwapInfo });
    expect(updated).toMatchObject({ fromAmount: inputAmount });
  });

  it('updates fromAmount from batchPermitSwap calldata', () => {
    const data = buildBatchPermitSwapCalldata();
    expect(data.startsWith('0x8d44ea24')).toBe(true);
    const updated = decoder.updateSwapInfo({ data, eventSwapInfo: baseSwapInfo });
    expect(updated).toMatchObject({ fromAmount: inputAmount });
  });

  it('updates fromAmount from gaslessExecuteMultiSwap calldata', () => {
    const data = buildGaslessExecuteMultiSwapCalldata();
    expect(data.startsWith('0xd367ada5')).toBe(true);
    const updated = decoder.updateSwapInfo({ data, eventSwapInfo: baseSwapInfo });
    expect(updated).toMatchObject({ fromAmount: inputAmount });
  });

  it('updates fromAmount from gaslessExecuteMultiSwapWithWitness calldata', () => {
    const data = buildGaslessExecuteMultiSwapWithWitnessCalldata();
    expect(data.startsWith('0xdcdc6089')).toBe(true);
    const updated = decoder.updateSwapInfo({ data, eventSwapInfo: baseSwapInfo });
    expect(updated).toMatchObject({ fromAmount: inputAmount });
  });

  it('updates fromAmount from gaslessExecuteSwap calldata', () => {
    const data = buildGaslessExecuteSwapCalldata();
    expect(data.startsWith('0x0d2eedd4')).toBe(true);
    const updated = decoder.updateSwapInfo({ data, eventSwapInfo: baseSwapInfo });
    expect(updated).toMatchObject({ fromAmount: inputAmount });
  });

  it('updates fromAmount for array swap info', () => {
    const data = buildSingleSwapCalldata();
    const updated = decoder.updateSwapInfo({
      data,
      eventSwapInfo: [{ ...baseSwapInfo }, { ...baseSwapInfo, fromToken: '0x0000000000000000000000000000000000000001' as HexString }],
    });
    expect(Array.isArray(updated)).toBe(true);
    expect((updated as (typeof baseSwapInfo)[])[0].fromAmount).toBe(inputAmount);
  });

  it('returns eventSwapInfo when decoded input token list is empty', () => {
    const data = buildMultiSwapCalldata([]);
    expect(decoder.updateSwapInfo({ data, eventSwapInfo: baseSwapInfo })).toEqual(baseSwapInfo);
  });

  it('keeps original fromAmount when decoded token does not match', () => {
    const data = buildSingleSwapCalldata();
    const updated = decoder.updateSwapInfo({
      data,
      eventSwapInfo: { ...baseSwapInfo, fromToken: '0x0000000000000000000000000000000000000001' as HexString },
    });
    expect(updated).toMatchObject({ fromAmount: BigInt(100) });
  });

  it('returns eventSwapInfo when decode throws', () => {
    const updated = decoder.updateSwapInfo({ data: '0x50d52584', eventSwapInfo: baseSwapInfo });
    expect(updated).toEqual(baseSwapInfo);
  });
});
