export const RPC_RETRY_DELAY = 500;
export const RPC_BATCHING_WAIT_TIME = 1000;

// sui's own public fullnodes no longer serve json-rpc, so the fallback has to be a provider that does
export const SUI_DEFAULT_RPC = 'https://sui-rpc.publicnode.com';

export const MEMPOOL_API_URL = {
  mainnet: 'https://mempool.space/api',
  testnet: 'https://mempool.space/testnet4/api',
};
