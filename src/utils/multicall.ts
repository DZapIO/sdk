import { MulticallParameters } from 'viem';
import { StatusCodes, TxnStatus } from '../enums';
import { getPublicClient } from './index';

/**
 * Batch multiple contract calls using multicall
 */
export const multicall = async ({
  chainId,
  contracts,
  rpcUrls,
  allowFailure = false,
}: {
  chainId: number;
  contracts: MulticallParameters['contracts'];
  rpcUrls?: string[];
  allowFailure?: boolean;
}): Promise<{ status: TxnStatus; code: StatusCodes; data: unknown[] }> => {
  try {
    const publicClient = getPublicClient({ chainId, rpcUrls });
    const results = await publicClient.multicall({
      contracts,
      allowFailure,
    });

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      data: results,
    };
  } catch (error: any) {
    console.error('Multicall failed:', error);
    return {
      status: TxnStatus.error,
      code: error.code || StatusCodes.Error,
      data: [],
    };
  }
};
