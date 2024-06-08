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

export const AvailableAbis = {
  dZapCoreAbi: 'dZapCoreAbi',
  dZapDcaAbi: 'dZapDcaAbi',
} as const;

export const Services = {
  BatchSwap: 'batchSwap',
  CrossChain: 'crossChain',
  Dca: 'dca',
} as const;

export const HISTORICAL_BLOCK = 10;
