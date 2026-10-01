import { config } from '../../../src/config';
import { exclusiveChainIds } from '../../../src/constants/chains';
import { getChainType, getRpcUrls } from '../../../src/transactionHandlers/adapters';
import { suivmAdapter } from '../../../src/transactionHandlers/adapters/suivm';
import { svmAdapter } from '../../../src/transactionHandlers/adapters/svm';
import { ChainData } from '../../../src/types';

const chainConfig = {
  [exclusiveChainIds.sui]: {
    chainType: 'suivm',
    rpcProviders: [
      { url: 'https://keyed.example', keyRequired: true },
      { url: 'https://public.example', keyRequired: false },
    ],
  },
} as unknown as ChainData;

describe('chain type', () => {
  it('reads the chain type from the chain config', () => {
    expect(getChainType(exclusiveChainIds.sui, chainConfig)).toBe('suivm');
  });

  it.each([
    [exclusiveChainIds.solana, 'svm'],
    [exclusiveChainIds.sui, 'suivm'],
    [exclusiveChainIds.btc, 'bvm'],
    [exclusiveChainIds.btcTestnet, 'bvm'],
    [exclusiveChainIds.hyperLiquid, 'hypevm'],
    [42161, 'evm'],
  ])('knows chain %s to be %s when the chain config cannot be fetched', (chainId, chainType) => {
    expect(getChainType(chainId, null)).toBe(chainType);
  });
});

describe('rpc urls', () => {
  afterEach(() => config.setRpcUrlsByChainId({}));

  it('takes the given rpcs first', () => {
    expect(getRpcUrls(exclusiveChainIds.sui, chainConfig, ['https://given.example'])).toEqual(['https://given.example']);
  });

  it('then the rpcs set on the client', () => {
    config.setRpcUrlsByChainId({ [exclusiveChainIds.sui]: ['https://configured.example'] });

    expect(getRpcUrls(exclusiveChainIds.sui, chainConfig)).toEqual(['https://configured.example']);
  });

  it('then the rpcs of the chain config that need no key', () => {
    expect(getRpcUrls(exclusiveChainIds.sui, chainConfig)).toEqual(['https://public.example']);
  });

  it('leaves the adapter to fall back to the chain definition when there are none', () => {
    expect(getRpcUrls(exclusiveChainIds.sui, null)).toBeUndefined();
  });
});

describe('signer guards', () => {
  const svmSigner = { signTransaction: jest.fn() };
  const suiSigner = { signTransactionBytes: jest.fn() };

  it('do not take a sui signer for a solana one, nor the other way round', () => {
    expect(svmAdapter.isSigner(svmSigner as never)).toBe(true);
    expect(suivmAdapter.isSigner(suiSigner as never)).toBe(true);
    expect(svmAdapter.isSigner(suiSigner as never)).toBe(false);
    expect(suivmAdapter.isSigner(svmSigner as never)).toBe(false);
  });
});
