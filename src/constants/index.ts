export const STATUS = {
  pending: 'pending',
  inProgress: 'in-progress',
  success: 'success',
  rejected: 'rejected',
  error: 'error',
};

export const ERRORS = {
  NOT_FOUND: 'Request not found',
};

export const DZapAbis = {
  dZapCoreAbi: 'dZapCoreAbi',
  stagingDZapCoreAbi: 'stagingDZapCoreAbi',
  dZapDcaAbi: 'dZapDcaAbi',
} as const;

export const OtherAbis = {
  permit2Abi: 'permit2Abi',
  erc20Abi: 'erc20Abi',
} as const;

export const Services = {
  BatchSwap: 'batchSwap',
  CrossChain: 'crossChain',
  Dca: 'dca',
} as const;

export const HISTORICAL_BLOCK = 10;
