import { createWalletClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { DZapClient, TxnStatus } from '../src';
import { ZapQuoteRequest } from '../src/types/zap';

// 1. INITIALIZATION

const dZapClient = DZapClient.getInstance();

// Setup a signer. This is a placeholder.
// In a real app, you would get this from a wallet connector like RainbowKit, wagmi, etc.
const walletClient = createWalletClient({
  transport: http(),
  account: '0xYourWalletAddress' as `0x${string}`, // Replace with your actual wallet address
  chain: arbitrum,
});

// 2. ZAP OPERATIONS

async function runZapExamples() {
  console.log('Running Zap examples...');
  const userAddress = '0xYourWalletAddress'; // Replace with your address

  // A. GET ZAP QUOTE

  console.log('\nFetching zap quote...');
  const zapQuoteRequest: ZapQuoteRequest = {
    srcChainId: 42161, // Arbitrum
    destChainId: 42161, // Arbitrum (for simplicity, same chain)
    account: userAddress,
    srcToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    destToken: '0x724dc807b04555b71ed48a6896b6F41593b8C637', // Aave USDC
    amount: '374980', // Specify the amount in smallest unit (e.g., wei for ETH, or 6 decimals for USDC)
    recipient: userAddress, // The recipient address for the zap
    refundee: userAddress, // The address to refund any leftover gas
    slippage: 1, // 1%
  };

  try {
    const zapQuoteResponse = await dZapClient.getZapQuote(zapQuoteRequest);
    console.log('Zap quote received:', JSON.stringify(zapQuoteResponse, null, 2));

    if (!zapQuoteResponse) {
      console.log('Could not generate a zap transaction plan.');
      return;
    }

    // B. APPROVALS and signatures (See documentation for details)
    console.log('\nApproval is likely required for non-native tokens.');

    // C. EXECUTE ZAP

    // The `zap` method takes the request and executes, building steps if needed.
    console.log('\nExecuting zap...');
    if (walletClient.account) {
      try {
        // The `zap` method can take the request and optionally pre-built steps
        const zapResult = await dZapClient.zap({
          request: zapQuoteRequest,
          signer: walletClient,
        });
        console.log('Zap execution result:', zapResult);

        // D. GET ZAP TRANSACTION STATUS

        if (zapResult.status !== TxnStatus.success || !zapResult.txnHash) {
          throw new Error('Zap execution failed');
        }

        const txnHash = zapResult.txnHash;

        setTimeout(async () => {
          try {
            const statusResponse = await dZapClient.getZapTxnStatus({ chainId: '42161', txnHash });
            console.log('Zap transaction status:', JSON.stringify(statusResponse, null, 2));
          } catch (e) {
            console.error('Error getting zap status:', e);
          }
        }, 15000); // Wait 15 seconds
      } catch (error) {
        console.error('Error during zap execution:', error);
      }
    } else {
      console.log('Skipping zap execution as no wallet client is available.');
    }
  } catch (error) {
    console.error('An error occurred during zap operations:', error);
  }
}

runZapExamples();
