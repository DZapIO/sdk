import { DZapClient } from '../src';

const dZapClient = DZapClient.getInstance();

async function runChainUtilsExamples() {
  console.log('Running Chain Utilities examples...');

  console.log('\nFetching all supported chains...');
  try {
    const allChains = await dZapClient.chains.getSupportedChains();
    console.log(`Found ${Object.keys(allChains).length} supported chains.`);
    // Log a few chain details for brevity
    const chainSubset = Object.fromEntries(
      Object.entries(allChains)
        .slice(0, 3)
        .map(([key, chain]) => [key, { name: chain.name, chainId: chain.chainId, coin: chain.coin }]),
    );
    console.log('Chain subset:', JSON.stringify(chainSubset, null, 2));
  } catch (error) {
    console.error('Error fetching all chains:', error);
  }
}

runChainUtilsExamples();
