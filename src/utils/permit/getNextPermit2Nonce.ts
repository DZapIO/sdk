import { permit2ProxyAbi } from 'src/artifacts/Permit2Proxy';
import { HexString } from 'src/types';
import { getPublicClient } from '..';

const permitProxy: Record<number, HexString> = {
  42161: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
};

export const getNextPermit2Nonce = async (permitAddress: HexString, account: HexString, chainId: number, rpcUrls?: string[]) => {
  try {
    const address = permitProxy[chainId];
    if (!address) throw new Error(`No permit2 proxy address for chainId ${chainId}`);
    const nonce = await getPublicClient({ chainId, rpcUrls }).readContract({
      address: permitProxy[chainId],
      abi: permit2ProxyAbi,
      functionName: 'nextNonce',
      args: [account],
    });
    return BigInt(nonce);
  } catch (error) {
    console.error('Unable to get next permit2 nonce', { error });
    throw error;
  }
};
