import { arbitrum } from 'viem/chains';
import { extendViemChain } from '../../../src/utils/extendViemChain';

describe('utils/extendViemChain', () => {
  it('merges base chain with extension', () => {
    const extended = extendViemChain(arbitrum, { name: 'Custom Arbitrum' });
    expect(extended.id).toBe(arbitrum.id);
    expect(extended.name).toBe('Custom Arbitrum');
    expect(extended.nativeCurrency).toEqual(arbitrum.nativeCurrency);
  });
});
