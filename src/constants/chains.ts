export const exclusiveChainIds = {
  zkSync: 324,
  arthera: 10242,
  gnosis: 100,
  kaia: 8217,
  bounceBit: 6001,
  biFrost: 996,
  flare: 14,
  iotaEvm: 8822,
  opbnb: 204,
  zkFair: 42766,
  bahamut: 5165,
  immutableZkevm: 13371,
  abstract: 2741,
  lens: 232,
  citreaTestnet: 5115,
  hyperLiquid: 998,
};

export const chainTypes = {
  evm: 'evm',
  bvm: 'bvm',
  svm: 'svm',
  aptosvm: 'aptosvm',
  cosmos: 'cosmos',
  nearvm: 'nearvm',
  starknetvm: 'starknetvm',
  stellarvm: 'stellarvm',
  suivm: 'suivm',
  tonvm: 'tonvm',
  tronvm: 'tronvm',
} as const;

export const chainIds = {
  bitcoin: 1000,
  bitcoinTestnet: 1001,
  solana: 7565164,
  sui: 19219,
  tron: 728126428,
  ton: 607,
  aptos: 116201519,
  ethereum: 1,
  bitcointestnet: 1001,
  hyperLiquid: 998,
  polygon: 137,
} as const;

/** Spender address for HyperLiquid (chainId 998) used for token approvals. Use chain config router when available. */
export const hyperLiquidSpender = '0x0000000000000000000000000000000000000000' as `0x${string}`;
