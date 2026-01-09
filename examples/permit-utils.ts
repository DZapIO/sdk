import { createWalletClient, http, parseUnits } from 'viem';
import { arbitrum } from 'viem/chains';
import { ApprovalModes, DZapClient, PermitTypes, Services } from '../src';
import { StatusCodes, TxnStatus } from '../src/enums';
import { HexString, SignatureCallbackParams } from '../src/types';

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
  const amountToTrade = parseUnits('1000', 18).toString(); // 1000 DAI
  const rpcUrls = ['https://arb1.arbitrum.io/rpc'];

  // A. CHECK ALLOWANCE

  console.log('\nChecking allowance...');
  try {
    const allowanceResponse = await dZapClient.approvals.getAllowance({
      chainId,
      sender: senderAddress,
      service: Services.trade,
      tokens: [{ address: tokenToApprove, amount: amountToTrade }],
      rpcUrls,
      mode: ApprovalModes.PermitWitnessTransferFrom,
    });
    console.log('Allowance details:', JSON.stringify(allowanceResponse, null, 2));

    const { approvalNeeded } = allowanceResponse.data[tokenToApprove];

    // B. APPROVE (if allowance is insufficient and wallet exists)

    if (walletClient.account && approvalNeeded) {
      console.log('\nAllowance is insufficient. Requesting approval...');
      try {
        await dZapClient.approvals.approve({
          chainId,
          signer: walletClient,
          service: Services.trade,
          mode: ApprovalModes.PermitWitnessTransferFrom,
          tokens: [{ address: tokenToApprove, amount: amountToTrade }],
          approvalTxnCallback: async ({
            txnDetails,
            address,
          }: {
            txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
            address: HexString;
          }) => {
            console.log(`Approval transaction sent for ${address}:`, txnDetails);
            return null;
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
      const signResponse = await dZapClient.approvals.sign({
        chainId,
        signer: walletClient,
        sender: senderAddress,
        service: Services.trade,
        permitType: PermitTypes.PermitWitnessTransferFrom,
        tokens: [
          {
            address: tokenToApprove,
            amount: amountToTrade.toString(),
          },
        ],
        signatureCallback: async (params: SignatureCallbackParams) => {
          console.log(`Signature received for`, params);
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
