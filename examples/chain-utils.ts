import { DzapClient } from '../src';

const dzapClient = DzapClient.getInstance();

async function runChainUtilsExamples() {
  console.log('Running Chain Utilities examples...');

  console.log('\nFetching all supported chains...');
  try {
    const allChains = await dzapClient.getAllSupportedChains();
    console.log(`Found ${Object.keys(allChains).length} supported chains.`);
    // Log a few chain details for brevity
    const chainSubset = Object.fromEntries(
      Object.entries(allChains)
        .slice(0, 3)
        .map(([key, value]) => [key, { name: value.name, chainId: value.chainId, coin: value.coin }]),
    );
    console.log('Chain subset:', JSON.stringify(chainSubset, null, 2));
  } catch (error) {
    console.error('Error fetching all chains:', error);
  }
}

runChainUtilsExamples();
