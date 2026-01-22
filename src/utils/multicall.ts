import type { MulticallParameters, MulticallReturnType } from 'viem';

import { StatusCodes, TxnStatus } from '../enums';
import { ChainsService } from '../service/chains';
import type { HexString } from '../types';
import { logger } from './logger';

export const multicall = async <const TContracts extends readonly unknown[], TAllowFailure extends boolean = false>({
  chainId,
  contracts,
  rpcUrls,
  multicallAddress,
  allowFailure = false as TAllowFailure,
}: {
  chainId: number;
  contracts: TContracts;
  rpcUrls?: string[];
  multicallAddress?: HexString;
  allowFailure?: TAllowFailure;
}): Promise<{
  status: TxnStatus;
  code: StatusCodes;
  data: MulticallReturnType<TContracts, TAllowFailure>;
}> => {
  try {
    const publicClient = ChainsService.getPublicClient(chainId, rpcUrls);
    const multicallParams = {
      contracts,
      ...(multicallAddress && { multicallAddress }),
      allowFailure,
    } as MulticallParameters<TContracts, TAllowFailure>;
    const results = await publicClient.multicall(multicallParams);

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      data: results,
    };
  } catch (error: unknown) {
    const err = error as { code?: StatusCodes };
    logger.error('Multicall failed', { service: 'utils', chainId, error });
    return {
      status: TxnStatus.error,
      code: err.code || StatusCodes.Error,
      data: [] as unknown as MulticallReturnType<TContracts, TAllowFailure>,
    };
  }
};
