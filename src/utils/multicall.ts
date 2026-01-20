import type { MulticallParameters } from 'viem';

import { StatusCodes, TxnStatus } from '../enums';
import { ChainsService } from '../service/chains';
import type { HexString } from '../types';
import { logger } from './logger';

/**
 * Batch multiple contract calls using multicall
 */
export const multicall = async ({
  chainId,
  contracts,
  rpcUrls,
  multicallAddress,
  allowFailure = false,
}: {
  chainId: number;
  contracts: MulticallParameters['contracts'];
  rpcUrls?: string[];
  multicallAddress?: HexString;
  allowFailure?: boolean;
}): Promise<{ status: TxnStatus; code: StatusCodes; data: unknown[] }> => {
  try {
    const publicClient = ChainsService.getPublicClient(chainId, rpcUrls);
    const results = await publicClient.multicall({
      contracts,
      ...(multicallAddress && { multicallAddress }),
      allowFailure,
    });

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      data: results,
    };
  } catch (error: unknown) {
    const err = error as { code?: StatusCodes };
    logger.error('Multicall failed', { service: 'MulticallUtil', chainId, error });
    return {
      status: TxnStatus.error,
      code: err.code || StatusCodes.Error,
      data: [],
    };
  }
};
