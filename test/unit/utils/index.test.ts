import * as viem from 'viem';
import { encodeFunctionData, zeroAddress } from 'viem';
import { ContractVersion, StatusCodes, TxnStatus } from '../../../src/enums';
import { Services, OtherAbis, dZapNativeTokenFormat } from '../../../src/constants';
import { SwapAbisByFunctionName } from '../../../src/utils/decoder/swap/abis';
import * as inputDataDecoder from '../../../src/utils/decoder/swap/inputDataDecoder';
import {
  calcTotalSrcTokenAmount,
  generateUUID,
  getDZapAbi,
  getOtherAbis,
  getPublicClient,
  getTokensPairKey,
  getTrxId,
  handleDecodeTxnData,
  isDZapNativeToken,
  isOneToMany,
  isTypeSigner,
  readContract,
  writeContract,
} from '../../../src/utils';
import { createMockEthersSigner } from '../../helpers/mocks/signer';
import type { Chain, HexString } from '../../../src/types';

describe('utils/index', () => {
  let mockReadContract: jest.Mock;
  let mockSimulateContract: jest.Mock;

  const fromToken = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as HexString;
  const toToken = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as HexString;
  const account = '0x99BCEBf44433E901597D9fCb16E799a4847519f6' as HexString;

  const chain = {
    chainId: 42161,
    version: ContractVersion.v2,
    nativeToken: { contract: zeroAddress },
  } as Chain;

  const mockPublicClient = () => {
    mockReadContract = jest.fn();
    mockSimulateContract = jest.fn();
    return jest.spyOn(viem, 'createPublicClient').mockReturnValue({
      readContract: mockReadContract,
      simulateContract: mockSimulateContract,
    } as unknown as ReturnType<typeof viem.createPublicClient>);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getPublicClient uses custom rpc urls when provided', () => {
    const client = getPublicClient({ chainId: 42161, rpcUrls: ['https://custom.rpc'] });
    expect(client.readContract).toBeDefined();
  });

  it('getPublicClient uses chain rpc urls when custom list is empty', () => {
    const client = getPublicClient({ chainId: 42161, rpcUrls: [] });
    expect(client.readContract).toBeDefined();
  });

  it('getPublicClient uses default chain rpc urls when rpcUrls is undefined', () => {
    const client = getPublicClient({ chainId: 42161, rpcUrls: undefined });
    expect(client.readContract).toBeDefined();
  });

  it('getPublicClient uses bare http transport for unknown chains', () => {
    jest.spyOn(viem, 'createPublicClient').mockReturnValue({
      readContract: jest.fn(),
    } as unknown as ReturnType<typeof viem.createPublicClient>);

    getPublicClient({ chainId: 999999, rpcUrls: [] });
  });

  it('getTokensPairKey uses default native addresses', () => {
    const key = getTokensPairKey({
      srcToken: fromToken,
      destToken: toToken,
      srcChainId: 42161,
      destChainId: 8453,
    });
    expect(key).toBe(`42161_${fromToken}-8453_${toToken}`);
  });

  it('getTokensPairKey builds canonical pair key', () => {
    const key = getTokensPairKey({
      srcToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      destToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      srcChainId: 42161,
      destChainId: 8453,
      srcChainNativeAddress: zeroAddress,
      destChainNativeAddress: zeroAddress,
    });
    expect(key).toContain('42161');
    expect(key).toContain('8453');
  });

  it('readContract returns success payload', async () => {
    mockPublicClient();
    mockReadContract.mockResolvedValue(42n);
    const result = await readContract({
      chainId: 42161,
      contractAddress: fromToken,
      abi: [],
      functionName: 'balanceOf',
      rpcUrls: ['https://rpc.test'],
      args: [account],
    });
    expect(result).toEqual({ data: 42n, status: TxnStatus.success, code: StatusCodes.Success });
  });

  it('readContract returns error payload with code', async () => {
    mockPublicClient();
    mockReadContract.mockRejectedValue({ code: StatusCodes.UserRejectedRequest });
    const result = await readContract({
      chainId: 42161,
      contractAddress: fromToken,
      abi: [],
      functionName: 'balanceOf',
    });
    expect(result).toEqual({ status: TxnStatus.error, code: StatusCodes.UserRejectedRequest });
  });

  it('readContract returns generic error when code is missing', async () => {
    mockPublicClient();
    mockReadContract.mockRejectedValue(new Error('rpc failed'));
    const result = await readContract({
      chainId: 42161,
      contractAddress: fromToken,
      abi: [],
      functionName: 'balanceOf',
    });
    expect(result).toEqual({ status: TxnStatus.error, code: StatusCodes.Error });
  });

  it('writeContract returns success payload', async () => {
    mockPublicClient();
    mockSimulateContract.mockResolvedValue({ request: { to: fromToken } });
    const writeContractFn = jest.fn().mockResolvedValue('0xhash');
    const signer = { account, writeContract: writeContractFn } as any;

    const result = await writeContract({
      chainId: 42161,
      contractAddress: fromToken,
      abi: [],
      functionName: 'approve',
      signer,
      value: '1000',
    });

    expect(result).toEqual({ txnHash: '0xhash', status: TxnStatus.success, code: StatusCodes.Success });
    expect(mockSimulateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 1000n,
        account,
      }),
    );
  });

  it('writeContract returns rejected status for user rejection', async () => {
    mockPublicClient();
    mockSimulateContract.mockRejectedValue({ code: StatusCodes.UserRejectedRequest });
    const result = await writeContract({
      chainId: 42161,
      contractAddress: fromToken,
      abi: [],
      functionName: 'approve',
      signer: { account, writeContract: jest.fn() } as any,
    });
    expect(result).toEqual({ status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, txnHash: '' });
  });

  it('writeContract returns error status for other failures', async () => {
    mockPublicClient();
    mockSimulateContract.mockRejectedValue({ code: StatusCodes.ContractExecutionError });
    const result = await writeContract({
      chainId: 42161,
      contractAddress: fromToken,
      abi: [],
      functionName: 'approve',
      signer: { account, writeContract: jest.fn() } as any,
    });
    expect(result).toEqual({ status: TxnStatus.error, code: StatusCodes.ContractExecutionError, txnHash: '' });
  });

  it('calcTotalSrcTokenAmount sums amounts', () => {
    expect(calcTotalSrcTokenAmount([{ amount: '100' }, { amount: '200' }])).toBe(300n);
    expect(calcTotalSrcTokenAmount([])).toBe(0n);
  });

  it('isOneToMany compares token addresses', () => {
    expect(isOneToMany('0xabc', '0xabc')).toBe(true);
    expect(isOneToMany('0xabc', '0xdef')).toBe(false);
  });

  it('generateUUID returns hex from stringToHex', () => {
    const stringToHexSpy = jest.spyOn(viem, 'stringToHex').mockReturnValue(`0x${'b'.repeat(64)}` as viem.Hex);
    const uuid = generateUUID();
    expect(uuid).toBe(`0x${'b'.repeat(64)}`);
    expect(stringToHexSpy).toHaveBeenCalledWith(expect.any(String), { size: 32 });
  });

  it('generateUUID uses performance timing when date time is exhausted', () => {
    jest.spyOn(Date.prototype, 'getTime').mockReturnValue(0);
    Object.defineProperty(global, 'performance', {
      value: { now: () => 1234 },
      configurable: true,
    });
    const stringToHexSpy = jest.spyOn(viem, 'stringToHex').mockReturnValue(`0x${'c'.repeat(64)}` as viem.Hex);

    generateUUID();

    expect(stringToHexSpy).toHaveBeenCalled();
  });

  it('generateUUID handles missing performance API', () => {
    jest.spyOn(Date.prototype, 'getTime').mockReturnValue(0);
    Object.defineProperty(global, 'performance', {
      value: undefined,
      configurable: true,
    });
    jest.spyOn(viem, 'stringToHex').mockReturnValue(`0x${'d'.repeat(64)}` as viem.Hex);

    expect(generateUUID()).toBe(`0x${'d'.repeat(64)}`);
  });

  it('getTrxId returns hex id derived from account', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const trxId = getTrxId(account);
    expect(trxId).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(logSpy).toHaveBeenCalled();
  });

  it('isDZapNativeToken identifies dzap native format', () => {
    expect(isDZapNativeToken(dZapNativeTokenFormat)).toBe(true);
  });

  it('isTypeSigner distinguishes ethers Signer', () => {
    expect(isTypeSigner(createMockEthersSigner())).toBe(true);
    expect(isTypeSigner({ sendTransaction: jest.fn() })).toBe(false);
  });

  it('getDZapAbi returns trade and dca abis', () => {
    expect(getDZapAbi(Services.trade, ContractVersion.v1)).toBeDefined();
    expect(getDZapAbi(Services.trade, ContractVersion.v2)).toBeDefined();
    expect(getDZapAbi(Services.dca, ContractVersion.v1)).toBeDefined();
    expect(() => getDZapAbi(Services.trade, 'invalid' as ContractVersion)).toThrow('Invalid Version');
    expect(() => getDZapAbi(Services.zap, ContractVersion.v1)).toThrow('Invalid Service');
  });

  it('getOtherAbis returns permit2 and erc20 abis', () => {
    expect(getOtherAbis(OtherAbis.permit2)).toBeDefined();
    expect(getOtherAbis(OtherAbis.erc20)).toBeDefined();
    expect(() => getOtherAbis('invalid' as keyof typeof OtherAbis)).toThrow('Invalid Abi');
  });

  it('handleDecodeTxnData returns empty swap info when logs cannot be parsed', () => {
    const parseEventLogsSpy = jest.spyOn(viem, 'parseEventLogs').mockImplementation(() => {
      throw new Error('parse failed');
    });

    const result = handleDecodeTxnData({ input: '0x' } as any, { logs: [] } as any, Services.trade, chain);

    expect(result.swapInfo).toEqual([]);
    expect(result.swapFailPairs).toEqual([]);
    expect(parseEventLogsSpy).toHaveBeenCalled();
  });

  it('handleDecodeTxnData marks failed pairs for array swap info', () => {
    jest.spyOn(viem, 'parseEventLogs').mockReturnValue([
      {
        args: {
          swapInfo: [
            {
              dex: 'uniswap',
              fromToken: zeroAddress,
              fromAmount: 0n,
              toToken,
              returnToAmount: 100n,
            },
          ],
        },
      },
    ] as any);

    const result = handleDecodeTxnData({ input: '0x' } as any, { logs: [{}] } as any, Services.trade, chain);

    expect(result.swapFailPairs).toHaveLength(1);
    expect(result.swapFailPairs[0]).toContain('42161');
    expect(Array.isArray(result.swapInfo)).toBe(true);
  });

  it('handleDecodeTxnData formats successful array swap info', () => {
    jest.spyOn(viem, 'parseEventLogs').mockReturnValue([
      {
        args: {
          swapInfo: [
            {
              dex: 'uniswap',
              fromToken,
              fromAmount: 100n,
              toToken,
              returnToAmount: 99n,
            },
          ],
        },
      },
    ] as any);

    const result = handleDecodeTxnData({ input: '0x' } as any, { logs: [{}] } as any, Services.trade, chain);

    expect(result.swapFailPairs).toEqual([]);
    expect((result.swapInfo as any[])[0].fromAmount).toBe(100n);
  });

  it('handleDecodeTxnData marks failed pairs for single swap info object', () => {
    jest.spyOn(viem, 'parseEventLogs').mockReturnValue([
      {
        args: {
          swapInfo: {
            dex: 'uniswap',
            fromToken,
            fromAmount: 100n,
            toToken,
            returnToAmount: 0n,
          },
        },
      },
    ] as any);

    const result = handleDecodeTxnData({ input: '0x' } as any, { logs: [{}] } as any, Services.trade, chain);

    expect(result.swapFailPairs).toHaveLength(1);
    expect((result.swapInfo as any).returnToAmount).toBe(0n);
  });

  it('handleDecodeTxnData updates swap info from transaction input data', () => {
    const inputAmount = BigInt(500000);
    const calldata = encodeFunctionData({
      abi: SwapAbisByFunctionName.SingleSwap,
      functionName: 'swap',
      args: [
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x',
        '0x',
        BigInt(9999999999),
        { token: fromToken, amount: inputAmount, permit: '0x' },
        {
          recipient: account,
          from: fromToken,
          to: toToken,
          fromAmount: inputAmount,
          minToAmount: BigInt(1),
        },
        {
          dex: 'uniswap',
          callTo: '0x0000000000000000000000000000000000000002',
          approveTo: '0x0000000000000000000000000000000000000003',
          swapCallData: '0x',
          isDirectTransfer: false,
        },
      ],
    });

    jest.spyOn(viem, 'parseEventLogs').mockReturnValue([
      {
        args: {
          swapInfo: {
            dex: 'uniswap',
            fromToken,
            fromAmount: 100n,
            toToken,
            returnToAmount: 99n,
          },
        },
      },
    ] as any);

    const result = handleDecodeTxnData({ input: calldata } as any, { logs: [{}] } as any, Services.trade, chain);

    expect((result.swapInfo as any).fromAmount).toBe(inputAmount);
  });

  it('handleDecodeTxnData filters null parsed events', () => {
    jest.spyOn(viem, 'parseEventLogs').mockReturnValue([
      null,
      {
        args: {
          swapInfo: {
            dex: 'uniswap',
            fromToken,
            fromAmount: 100n,
            toToken,
            returnToAmount: 99n,
          },
        },
      },
    ] as any);

    const result = handleDecodeTxnData({ input: '0x' } as any, { logs: [{}] } as any, Services.trade, { ...chain, version: undefined } as Chain);

    expect((result.swapInfo as any).fromAmount).toBe(100n);
  });

  it('handleDecodeTxnData falls back to event swap info when decoder returns undefined', () => {
    jest.spyOn(viem, 'parseEventLogs').mockReturnValue([
      {
        args: {
          swapInfo: {
            dex: 'uniswap',
            fromToken,
            fromAmount: 100n,
            toToken,
            returnToAmount: 99n,
          },
        },
      },
    ] as any);
    jest.spyOn(inputDataDecoder, 'SwapInputDataDecoder').mockImplementation(
      () =>
        ({
          updateSwapInfo: jest.fn().mockReturnValue(undefined),
        }) as unknown as inputDataDecoder.SwapInputDataDecoder,
    );

    const result = handleDecodeTxnData({ input: '0xdeadbeef' } as any, { logs: [{}] } as any, Services.trade, chain);

    expect((result.swapInfo as any).fromAmount).toBe(100n);
  });

  it('handleDecodeTxnData ignores empty swap info objects', () => {
    jest.spyOn(viem, 'parseEventLogs').mockReturnValue([
      {
        args: {
          swapInfo: {},
        },
      },
    ] as any);

    const result = handleDecodeTxnData({ input: '0x' } as any, { logs: [{}] } as any, Services.trade, chain);

    expect(result.swapFailPairs).toEqual([]);
    expect(result.swapInfo).toEqual([]);
  });
});
