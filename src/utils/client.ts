import { createPublicClient, fallback, http } from 'viem';
import { viemChainsById } from '../chains';
import { RPC_BATCHING_WAIT_TIME, RPC_RETRY_DELAY } from '../constants/rpc';

const publicClientRpcConfig = { batch: { wait: RPC_BATCHING_WAIT_TIME }, retryDelay: RPC_RETRY_DELAY };

/**
 * Creates a public client for blockchain interactions
 * @param rpcUrls - Optional array of RPC URLs to use
 * @param chainId - The chain ID to connect to
 * @returns A configured viem public client
 */
export const getPublicClient = ({ rpcUrls, chainId }: { rpcUrls: string[] | undefined; chainId: number }) => {
  const rpcs = rpcUrls && Array.isArray(rpcUrls) && rpcUrls.length > 0;
  return createPublicClient({
    chain: viemChainsById[chainId],
    transport: fallback(rpcs ? rpcUrls.map((rpc: string) => http(rpc, publicClientRpcConfig)) : [http()]),
    batch: {
      multicall: {
        wait: RPC_BATCHING_WAIT_TIME,
      },
    },
  });
};
