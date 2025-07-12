import { createWalletClient, http, parseUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { ApprovalModes, DZapClient, PermitTypes, Services } from '../src';
import { StatusCodes, TxnStatus } from '../src/enums';
import { HexString } from '../src/types';

const dZapClient = DZapClient.getInstance();

// Setup a signer. This is a placeholder.
// In a real app, you would get this from a wallet connector like RainbowKit, wagmi, etc.
const walletClient = createWalletClient({
  transport: http(),
  account: '0xYourWalletAddress', // Replace with your actual wallet address
  chain: arbitrum,
});

async function runPermitExamples() {
  console.log('Running Permit examples...');
  const chainId = 42161; // Arbitrum
  // Replace with your actual address
  const senderAddress = '0xYourWalletAddress' as HexString;
  const tokenToApprove = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1' as HexString; // DAI
  const amountToTrade = parseUnits('1000', 18); // 1000 DAI
  const rpcUrls = ['https://eth.llamarpc.com'];

  // A. CHECK ALLOWANCE

  console.log('\nChecking allowance...');
  try {
    const allowanceResponse = await dZapClient.getAllowance({
      chainId,
      sender: senderAddress,
      service: Services.swap,
      tokens: [{ address: tokenToApprove, amount: amountToTrade }],
      rpcUrls,
      mode: ApprovalModes.Permit2,
    });
    console.log('Allowance details:', JSON.stringify(allowanceResponse, null, 2));

    const tokenAllowance = allowanceResponse.data.tokenAllowances;

    // B. APPROVE (if allowance is insufficient and wallet exists)

    if (walletClient.account && tokenAllowance && BigInt(tokenAllowance[tokenToApprove].allowance) < amountToTrade) {
      console.log('\nAllowance is insufficient. Requesting approval...');
      try {
        await dZapClient.approve({
          chainId,
          signer: walletClient,
          sender: senderAddress,
          service: Services.swap,
          mode: ApprovalModes.Permit2,
          tokens: [{ address: tokenToApprove, amount: amountToTrade }],
          approvalTxnCallback: async ({
            txnDetails,
            address,
          }: {
            txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
            address: HexString;
          }) => {
            console.log(`Approval transaction sent for ${address}:`, txnDetails);
          },
        });
        console.log('Approval transaction sent. Please confirm in your wallet.');
      } catch (error) {
        console.error('Error during approval:', error);
      }
    } else if (!walletClient.account) {
      console.log('\nSkipping approval check as no wallet client is available.');
    } else {
      console.log('\nSufficient allowance already granted.');
    }
  } catch (error) {
    console.error('An error occurred checking allowance:', error);
  }

  // C. SIGN PERMIT (Gas-less approval via Permit2)

  // This is an alternative to `approve`. It lets users sign a message instead of
  // sending a transaction. It is only supported for tokens that use Permit2.
  console.log('\nSigning permit...');
  if (walletClient.account) {
    try {
      const routerAddress = (await dZapClient.getAllSupportedChains())[chainId].contracts?.router;

      if (!routerAddress) {
        throw new Error(`Router address not found for chain ID ${chainId}`);
      }
      const signResponse = await dZapClient.sign({
        chainId,
        signer: walletClient,
        sender: senderAddress,
        service: 'swap',
        spender: routerAddress as HexString,
        permitType: PermitTypes.Permit2,
        tokens: [
          {
            address: tokenToApprove,
            amount: amountToTrade.toString(),
          },
        ],
        signatureCallback: async ({ permitData, srcToken }) => {
          console.log(`Signature received for ${srcToken}:`, permitData);
        },
      });
      console.log('Sign response:', signResponse);
    } catch (error) {
      console.error('Error signing permit:', error);
    }
  } else {
    console.log('Skipping sign permit as no wallet client is available.');
  }
}

runPermitExamples();
