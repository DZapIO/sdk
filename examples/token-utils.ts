import { DZapClient } from '../src';

const dZapClient = DZapClient.getInstance();

async function runTokenUtilsExamples() {
  console.log('Running Token Utilities examples...');

  const arbitrumChainId = 42161;

  // A. GET ALL TOKENS FOR A CHAIN

  console.log(`\nFetching all tokens for chain ${arbitrumChainId}...`);
  try {
    const allTokens = await dZapClient.getAllTokens(arbitrumChainId);
    console.log(`Found ${Object.keys(allTokens).length} tokens.`);
    // Log the first 5 tokens for brevity
    console.log('First 5 tokens:', Object.fromEntries(Object.entries(allTokens).slice(0, 5)));
  } catch (error) {
    console.error('Error fetching all tokens:', error);
  }

  // B. GET DETAILS FOR A SPECIFIC TOKEN

  const usdcAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // USDC on arbitrum
  const userAddress = '0xYourWalletAddress'; // Replace with your address to check balance
  console.log(`\nFetching details for USDC on arbitrum...`);
  try {
    const tokenDetails = await dZapClient.getTokenDetails(
      usdcAddress,
      arbitrumChainId,
      userAddress,
      true, // include balance
      true, // include price
    );
    console.log('Token details:', JSON.stringify(tokenDetails, null, 2));
  } catch (error) {
    console.error('Error fetching token details:', error);
  }

  // C. GET PRICES FOR MULTIPLE TOKENS

  const tokensToPrice = [
    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // Native ETH
    '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', // WETH
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC
  ];
  console.log(`\nFetching prices for ${tokensToPrice.length} tokens...`);
  try {
    const tokenPrices = await dZapClient.getTokenPrices(tokensToPrice, arbitrumChainId);
    console.log('Token prices:', JSON.stringify(tokenPrices, null, 2));
  } catch (error) {
    console.error('Error fetching token prices:', error);
  }
}

runTokenUtilsExamples();
