import { createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { erc20PermitAbi } from '../../../src/artifacts/ERC20Permit';
import { erc20Functions } from '../../../src/constants/erc20';
import { StatusCodes, TxnStatus } from '../../../src/enums';
import * as utils from '../../../src/utils';
import { multicall } from '../../../src/utils/multicall';
import { arbitrumOne, arbitrumUsdc, LIVE_TEST_TIMEOUT_MS, sampleAccounts } from '../../fixtures/realWorld';

describe('utils/multicall', () => {
  const realWorldContracts = [
    {
      address: arbitrumUsdc.address,
      abi: erc20PermitAbi,
      functionName: erc20Functions.name,
    },
    {
      address: arbitrumUsdc.address,
      abi: erc20PermitAbi,
      functionName: erc20Functions.decimals,
    },
    {
      address: arbitrumUsdc.address,
      abi: erc20PermitAbi,
      functionName: erc20Functions.nonces,
      args: [sampleAccounts.zeroLike],
    },
  ] as const;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(
    'reads live Arbitrum USDC metadata via multicall',
    async () => {
      const result = await multicall({
        chainId: arbitrum.id,
        rpcUrls: [arbitrumOne.rpc],
        contracts: [...realWorldContracts],
        allowFailure: true,
      });

      expect(result.status).toBe(TxnStatus.success);
      expect(result.code).toBe(StatusCodes.Success);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'success', result: 'USD Coin' }),
          expect.objectContaining({ status: 'success', result: 6 }),
          expect.objectContaining({ status: 'success', result: expect.any(BigInt) }),
        ]),
      );
    },
    LIVE_TEST_TIMEOUT_MS,
  );

  it('forwards custom multicall address when provided', async () => {
    const publicClient = createPublicClient({
      chain: arbitrum,
      transport: http(arbitrumOne.rpc),
    });
    const multicallSpy = jest.spyOn(publicClient, 'multicall').mockResolvedValue([
      { status: 'success', result: 'USD Coin' },
      { status: 'success', result: 6 },
      { status: 'success', result: 0n },
    ] as any);
    jest.spyOn(utils, 'getPublicClient').mockReturnValue(publicClient as unknown as ReturnType<typeof utils.getPublicClient>);

    await multicall({
      chainId: arbitrum.id,
      rpcUrls: [arbitrumOne.rpc],
      contracts: [...realWorldContracts],
      multicallAddress: arbitrumOne.multicall3,
      allowFailure: true,
    });

    expect(multicallSpy).toHaveBeenCalledWith({
      contracts: [...realWorldContracts],
      multicallAddress: arbitrumOne.multicall3,
      allowFailure: true,
    });
  });

  it('returns error when multicall RPC fails', async () => {
    jest.spyOn(utils, 'getPublicClient').mockReturnValue({
      multicall: jest.fn().mockRejectedValue(new Error('rpc down')),
    } as unknown as ReturnType<typeof utils.getPublicClient>);

    const result = await multicall({
      chainId: arbitrum.id,
      rpcUrls: [arbitrumOne.rpc],
      contracts: [...realWorldContracts],
      allowFailure: true,
    });

    expect(result.status).toBe(TxnStatus.error);
    expect(result.code).toBe(StatusCodes.Error);
    expect(result.data).toEqual([]);
  });

  it('returns error code from thrown RPC error when available', async () => {
    jest.spyOn(utils, 'getPublicClient').mockReturnValue({
      multicall: jest.fn().mockRejectedValue({ code: StatusCodes.UserRejectedRequest }),
    } as unknown as ReturnType<typeof utils.getPublicClient>);

    const result = await multicall({
      chainId: arbitrum.id,
      rpcUrls: [arbitrumOne.rpc],
      contracts: [...realWorldContracts],
    });

    expect(result.status).toBe(TxnStatus.error);
    expect(result.code).toBe(StatusCodes.UserRejectedRequest);
  });
});
