import { fetchTradeBuildTxnData } from 'src/api';
import { StatusCodes, TxnStatus } from 'src/enums';
import { AdditionalInfo, ContractErrorResponse, DZapTransactionResponse, HexString, TradeBuildTxnRequest, TradeBuildTxnResponse } from '../types';
import { isTypeSigner } from '../utils';
import { BatchCallParams, sendBatchCalls } from '../utils/eip-5792/sendBatchCalls';
import { waitForBatchTransactionReceipt } from '../utils/eip-5792/waitForBatchTransactionReceipt';
import { handleViemTransactionError, isAxiosError } from '../utils/errors';

import { Signer } from 'ethers';
import { viemChainsById } from 'src/utils/chains';
import { generateApprovalBatchCalls } from 'src/utils/eip-5792/batchApproveTokens';
import { WalletClient } from 'viem';

class TradeTxnHandler {
  private static sendTransaction = async (
    signer: Signer | WalletClient,
    txnParams: { from: string; to: string; data: string; value: string; gasLimit?: string },
    chainId: number,
    additionalInfo: AdditionalInfo | undefined,
    updatedQuotes: Record<string, string>,
  ): Promise<DZapTransactionResponse> => {
    let txnHash: HexString;

    if (isTypeSigner(signer)) {
      const txnRes = await signer.sendTransaction({
        from: txnParams.from,
        to: txnParams.to,
        data: txnParams.data,
        value: txnParams.value,
        gasLimit: txnParams.gasLimit,
      });
      txnHash = txnRes.hash as HexString;
    } else {
      txnHash = await signer.sendTransaction({
        chain: viemChainsById[chainId],
        account: txnParams.from as HexString,
        to: txnParams.to as HexString,
        data: txnParams.data as HexString,
        value: BigInt(txnParams.value),
      });
    }

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      txnHash,
      additionalInfo,
      updatedQuotes,
    };
  };

  private static sendTxnWithBatch = async (
    request: TradeBuildTxnRequest,
    signer: WalletClient,
    txnParams: { from: string; to: string; data: string; value: string },
    chainId: number,
    additionalInfo: AdditionalInfo | undefined,
    updatedQuotes: Record<string, string>,
    rpcUrls?: string[],
  ): Promise<DZapTransactionResponse> => {
    const approvalBatchCalls = await generateApprovalBatchCalls({
      tokens: request.data.map((token) => ({
        address: token.srcToken as HexString,
        amount: token.amount,
      })),
      chainId,
      sender: txnParams.from as HexString,
      spender: txnParams.to as HexString,
      rpcUrls,
    });

    const batchCalls: BatchCallParams[] = [
      ...approvalBatchCalls,
      {
        to: txnParams.to as HexString,
        data: txnParams.data as HexString,
        value: BigInt(txnParams.value),
      },
    ];

    // If no approvals are needed, send regular transaction for efficiency
    if (approvalBatchCalls.length === 0) {
      return this.sendTransaction(signer, txnParams, chainId, additionalInfo, updatedQuotes);
    }

    const batchResult = await sendBatchCalls(signer, batchCalls);
    if (!batchResult) {
      return {
        status: TxnStatus.error,
        errorMsg: 'Batch call failed',
        code: StatusCodes.Error,
      };
    }

    console.log('Waiting for batch transaction completion...');
    const receipt = await waitForBatchTransactionReceipt(signer, batchResult.id as HexString);
    console.log({ receipt });
    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      txnHash: receipt.transactionHash as HexString,
      additionalInfo,
      updatedQuotes,
    };
  };

  public static buildAndSendTransaction = async ({
    request,
    signer,
    txnData,
    batchTransaction = false,
    rpcUrls,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    txnData?: TradeBuildTxnResponse;
    batchTransaction: boolean;
    rpcUrls?: string[];
  }): Promise<DZapTransactionResponse> => {
    try {
      const chainId = request.fromChain;
      let buildTxnResponseData: TradeBuildTxnResponse;

      // Build transaction data if not provided
      if (txnData) {
        buildTxnResponseData = txnData;
      } else {
        buildTxnResponseData = await fetchTradeBuildTxnData(request);
      }

      const { data, from, to, value, gasLimit, additionalInfo, updatedQuotes } = buildTxnResponseData;
      const txnParams = { from, to, data, value, gasLimit };

      // Handle ethers signer (no batching support)
      if (batchTransaction && !isTypeSigner(signer)) {
        return this.sendTxnWithBatch(request, signer, txnParams, chainId, additionalInfo, updatedQuotes, rpcUrls);
      }

      console.log('Using viem walletClient - sending regular transaction.');
      return this.sendTransaction(signer, txnParams, chainId, additionalInfo, updatedQuotes);
    } catch (error: any) {
      console.log({ error });
      if (isAxiosError(error)) {
        if (error?.response?.status === StatusCodes.SimulationFailure) {
          return {
            status: TxnStatus.error,
            errorMsg: 'Simulation Failed',
            error: (error.response?.data as ContractErrorResponse).message,
            code: (error.response?.data as ContractErrorResponse).code,
            action: (error.response?.data as ContractErrorResponse).action,
          };
        }
        return {
          status: TxnStatus.error,
          errorMsg: 'Params Failed: ' + JSON.stringify((error?.response?.data as any)?.message),
          error: error?.response?.data ?? error,
          code: error?.response?.status ?? StatusCodes.Error,
        };
      }
      return handleViemTransactionError({ error });
    }
  };
}

export default TradeTxnHandler;
