export enum ConnectorType {
  injected = 'injected',
  walletConnect = 'walletConnect',
}

export enum Erc20PermitFunctions {
  NONCES = 'nonces',
  VERSION = 'version',
  PERMIT_TYPEHASH = 'PERMIT_TYPEHASH',
}

export enum Erc20Functions {
  NAME = 'name',
  ALLOWANCE = 'allowance',
  APPROVE = 'approve',
  TRANSFER = 'transfer',
  TRANSFER_FROM = 'transferFrom',
  BALANCE_OF = 'balanceOf',
  DECIMALS = 'decimals',
  SYMBOL = 'symbol',
}

export enum PermitType {
  PERMIT,
  PERMIT2,
}

export const TxnStatus = {
  pending: 'pending',
  inProgress: 'in-progress',
  success: 'success',
  rejected: 'rejected',
  error: 'error',
  reverted: 'reverted',
};

export const CHAINS_IDS = {
  ethereum: 1,
  polygon: 137,
  bsc: 56,
  gnosis: 100,
  fantom: 250,
  avalanche: 43114,
  arbitrum: 42161,
  optimism: 10,
  zkSync: 324,
  base: 8453,
  scroll: 534352,
  manta: 169,
} as const;

export enum Versions {
  V1 = 'v1',
  V1_2 = 'v1.2',
  V2 = 'v2',
}

export enum Services {
  BatchSwap = 'batchSwap',
  CrossChain = 'crossChain',
  Dca = 'dca',
}
