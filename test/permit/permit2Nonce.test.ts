import * as ABI from '../../src/artifacts';
import { getPublicClient } from '../../src/utils';
import { viemChainsById } from '../../src/chains';
import { Permit2Service } from '../../src/service/permit2';
import { getNextPermit2Nonce } from '../../src/utils/nonce';
import { HexString } from '../../src/types';

const permitProxy: Record<number, HexString> = {
  42161: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  8453: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  33139: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  42220: '0x89c6340B1a1f4b25D36cd8B063D49045caF3f818',
  747474: '0x628d684D57c73A5D8cA77F455Fdf2CC8Bd503c16',
};

export const getNextPermit2NonceFromProxy = async (permitAddress: HexString, account: HexString, chainId: number, rpcUrls?: string[]) => {
  try {
    const address = permitProxy[chainId];
    if (!address) {
      throw new Error(`No permit2 proxy address for chainId ${chainId}`);
    }
    const nonce = await getPublicClient({ chainId, rpcUrls }).readContract({
      address: permitProxy[chainId],
      abi: ABI.permit.permit2ProxyAbi,
      functionName: 'nextNonce',
      args: [account],
    });
    return BigInt(nonce);
  } catch (error) {
    console.error('Unable to get next permit2 nonce', { error });
    throw error;
  }
};

describe('Permit2 Nonce Tests', () => {
  const account = '0x4ab9F97585B0161f1aDa8484B209C44be54dad73';

  Object.entries(permitProxy).forEach(([chainIdStr]) => {
    const chainId = parseInt(chainIdStr);
    const chainName = viemChainsById[chainId]?.name || `Chain ${chainId}`;

    describe(`Testing ${chainName} (Chain ID: ${chainId})`, () => {
      it(`should get next nonce from proxy and our implementation on ${chainName}`, async () => {
        if (!viemChainsById[chainId]) {
          console.warn(`Skipping test for chain ${chainId} - not found in viemChainsById`);
          return;
        }

        const rpcUrls = viemChainsById[chainId]?.rpcUrls?.default?.http;
        if (!rpcUrls || rpcUrls.length === 0) {
          console.warn(`Skipping test for chain ${chainId} - no RPC URLs available`);
          return;
        }

        try {
          const urls = [...rpcUrls];
          const permitAddress = Permit2Service.getContractAddress(chainId);

          if (!permitAddress) {
            throw new Error(`No Permit2 address found for chain ${chainId}`);
          }

          const proxyNonce = await getNextPermit2NonceFromProxy(permitAddress, account, chainId, urls);

          const ourNonce = await getNextPermit2Nonce(permitAddress, account, chainId, urls);

          expect(proxyNonce).toBeDefined();
          expect(ourNonce).toBeDefined();
          expect(typeof proxyNonce).toBe('bigint');
          expect(typeof ourNonce).toBe('bigint');

          console.log(`${chainName}: Proxy Nonce = ${proxyNonce}, Our Nonce = ${ourNonce}`);
        } catch (error) {
          fail(`Failed to get nonce for chain ${chainId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }, 30000);
    });

    it('should get consistent nonces across multiple calls', async () => {
      const testChainId = 42161; // Arbitrum
      const rpcUrls = viemChainsById[testChainId]?.rpcUrls?.default?.http;

      if (!rpcUrls) {
        console.warn('Skipping consistency test - no RPC URLs for Arbitrum');
        return;
      }

      const permitAddress = Permit2Service.getContractAddress(testChainId);
      const urls = [...rpcUrls];

      const results = await Promise.all([
        getNextPermit2Nonce(permitAddress, account, testChainId, urls),
        getNextPermit2Nonce(permitAddress, account, testChainId, urls),
        getNextPermit2Nonce(permitAddress, account, testChainId, urls),
      ]);

      results.forEach((nonce, index) => {
        expect(nonce).toBeDefined();
        if (index > 0) {
          expect(nonce).toEqual(results[0]);
        }
      });
    }, 30000);
  });
});
