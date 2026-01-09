import { createWalletClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { DZapClient } from '../src'; // Corrected: Named import
import { TradeBuildTxnRequest, TradeQuote, TradeQuotesRequest, TradeStatusResponse } from '../src/types';

const dZapClient = DZapClient.getInstance();

// Setup a signer. This is a placeholder.
// In a real app, you would get this from a wallet connector like RainbowKit, wagmi, etc.
const walletClient = createWalletClient({
  transport: http(),
  account: '0xYourWalletAddress', // Replace with your actual wallet address
  chain: arbitrum,
});

async function runTradeExamples() {
  console.log('Running Swap and Bridge examples...');

  // A. GET QUOTES

  console.log('\nFetching quotes...');
  const userAddress = walletClient.account.address; // Replace with your actual wallet address
  const quotesRequest: TradeQuotesRequest = {
    fromChain: 42161,
    data: [
      {
        amount: '374980', // Specify the amount in smallest unit (e.g., wei for ETH, or 6 decimals for USDC)
        srcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
        destToken: '0x4200000000000000000000000000000000000006', // WETH
        toChain: 8453, // Base Chain
        slippage: 1, // 1%
      },
    ],
    account: userAddress,
  };

  try {
    const quotesResponse = await dZapClient.trade.getQuotes(quotesRequest);
    console.log('Quotes received:', JSON.stringify(quotesResponse, null, 2));

    // The response is an object with keys for each requested pair.
    const pairKey = Object.keys(quotesResponse)[0];
    const pairQuoteData = quotesResponse[pairKey];

    if (!pairQuoteData.quoteRates || Object.keys(pairQuoteData.quoteRates).length === 0) {
      console.log('No routes found for the requested trade.');
      return;
    }

    // recommendedSource gives the key for the best quote (e.g., "paraswap", "okx", etc.)
    const bestRouteKey = pairQuoteData.recommendedSource!;
    const bestQuote: TradeQuote = pairQuoteData.quoteRates[bestRouteKey];
    console.log(`\nBest route found via ${bestRouteKey}`);

    // B. APPROVALS (See documentation for details)
    console.log('\nApproval is likely required for non-native tokens.');

    // C. BUILD AND SEND TRANSACTION

    console.log('\nBuilding and sending transaction...');
    const buildTxRequest: TradeBuildTxnRequest = {
      fromChain: 42161,
      sender: userAddress,
      refundee: userAddress,
      gasless: false,
      data: [
        {
          amount: bestQuote.srcAmount,
          srcToken: bestQuote.srcToken.address,
          destToken: bestQuote.destToken.address,
          toChain: 8453,
          protocol: bestRouteKey,
          recipient: userAddress,
          slippage: 1,
        },
      ],
    };

    const txResult = await dZapClient.trade.execute({
      request: buildTxRequest,
      signer: walletClient,
    });

    console.log('Transaction response:', txResult);

    if (txResult.status === 'success' && txResult.txnHash) {
      console.log(`Transaction sent successfully! Hash: ${txResult.txnHash}`);

      // D. GET TRANSACTION STATUS

      console.log('\nFetching transaction status in 15 seconds...');
      setTimeout(async () => {
        try {
          const statusResponse = (await dZapClient.trade.getStatus({
            txHash: txResult.txnHash,
            chainId: 42161,
          })) as TradeStatusResponse;
          console.log('Transaction status:', JSON.stringify(statusResponse, null, 2));
        } catch (e) {
          console.error('Error getting status:', e);
        }
      }, 15000);
    } else {
      console.error('Transaction failed or hash not found:', txResult.errorMsg);
    }
  } catch (error) {
    console.error('An error occurred during swap/bridge operations:', error);
  }
}

runTradeExamples();
