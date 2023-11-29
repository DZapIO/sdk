export const STATUS = {
  pending: 'pending',
  inProgress: 'in-progress',
  success: 'success',
  rejected: 'rejected',
  error: 'error',
};

const ALCHEMY_KEY = '1YcxSmzXByFGQtW4ZNuTRVyLNm-1z7CN';

export const JSON_RPC_PROVIDER: { [key: number]: string } = {
  1: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  56: `https://bsc.publicnode.com`,
  137: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  42161: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  324: `https://mainnet.era.zksync.io`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
};

export const HISTORICAL_BLOCK = 10;
