export const erc20PermitFunctions = {
  nonces: 'nonces',
  version: 'version',
  PERMIT_TYPEHASH: 'PERMIT_TYPEHASH',
  allowance: 'allowance',
} as const;

export const erc20Functions = {
  name: 'name',
  allowance: 'allowance',
  approve: 'approve',
  transfer: 'transfer',
  transferFrom: 'transferFrom',
  balanceOf: 'balanceOf',
  decimals: 'decimals',
  symbol: 'symbol',
} as const;

export const eip2612PermitFunctions = {
  permit: 'permit',
  nonces: 'nonces',
  DOMAIN_SEPARATOR: 'DOMAIN_SEPARATOR',
  version: 'version',
} as const;
