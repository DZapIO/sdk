import fs from 'fs';
import path from 'path';
import type { Chain } from 'viem/chains';
import { customViemChains, viemChainsById } from '../../../src/chains';

const definitionsDir = path.join(__dirname, '../../../src/chains/definitions');
const definitionsImportPrefix = '../../../src/chains/definitions';

async function loadDefinitionChains(): Promise<Chain[]> {
  const chains: Chain[] = [];

  for (const file of fs.readdirSync(definitionsDir).filter((name) => name.endsWith('.ts'))) {
    const mod = (await import(`${definitionsImportPrefix}/${file.replace(/\.ts$/, '')}`)) as Record<string, unknown>;
    for (const exported of Object.values(mod)) {
      // Chains from viem's defineChain expose an `extend` helper; viem has no isChain guard.
      if (typeof exported === 'object' && exported !== null && 'extend' in exported && 'id' in exported) {
        chains.push(exported as unknown as Chain);
      }
    }
  }

  return chains;
}

describe('chains/index', () => {
  it('customViemChains includes every chain defined under chains/definitions', async () => {
    const definedChains = await loadDefinitionChains();
    const registeredIds = new Set(customViemChains.map((chain) => chain.id));

    const missingFromRegistry = definedChains.filter((chain) => !registeredIds.has(chain.id));
    expect(missingFromRegistry.map((chain) => ({ id: chain.id, name: chain.name }))).toEqual([]);
    expect(customViemChains).toHaveLength(definedChains.length);
  });

  it('viemChainsById resolves built-in and custom chains', () => {
    expect(viemChainsById[1]?.name).toBe('Ethereum');

    for (const chain of customViemChains) {
      expect(viemChainsById[chain.id]).toBe(chain);
    }
  });
});
