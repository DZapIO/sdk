import { HexString } from 'src/types';
import { getPublicClient } from '..';
import { permitProxyAbi } from 'src/artifacts/Permit2Proxy';

const permitProxy: Record<number, HexString> = {
  42161: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  8453: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  33139: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  42220: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  747474: '0x628d684D57c73A5D8cA77F455Fdf2CC8Bd503c16',
};

export const getNextPermit2Nonce = async (permitAddress: HexString, account: HexString, chainId: number, rpcUrls?: string[]) => {
  try {
    const nonce = await getPublicClient({ chainId, rpcUrls }).readContract({
      address: permitProxy[chainId],
      abi: permitProxyAbi,
      functionName: 'nextNonce',
      args: [account],
    });
    return BigInt(nonce);
  } catch (error) {
    console.error('Unable to get next permit2 nonce', { error });
    throw error;
  }
};
