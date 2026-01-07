import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { broadcastTradeTx, executeGaslessTxnData, fetchTradeBuildTxnData } from '../api';
import { exclusiveChainIds } from '../constants/chains';
import { PermitTypes } from '../constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../enums';
import {
  AdditionalInfo,
  ContractErrorResponse,
  DZapTransactionResponse,
  GaslessTradeBuildTxnResponse,
  HexString,
  TradeBuildTxnRequest,
  TradeBuildTxnResponse,
} from '../types';
import { CustomTypedDataParams } from '../types/permit';
import { isTypeSigner } from '../utils';
import { viemChainsById } from '../chains';
import { generateApprovalBatchCalls } from '../utils/eip-5792/batchApproveTokens';
import { BatchCallParams, sendBatchCalls } from '../utils/eip-5792/sendBatchCalls';
import { waitForBatchTransactionReceipt } from '../utils/eip-5792/waitForBatchTransactionReceipt';
import { handleViemTransactionError, isAxiosError } from '../utils/errors';
import PermitTxnHandler from './permit';
import { signCustomTypedData } from '../utils/signIntent/custom';

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
    multicallAddress?: HexString,
    rpcUrls?: string[],
  ): Promise<DZapTransactionResponse> => {
    const approvalBatchCalls = await generateApprovalBatchCalls({
      tokens: request.data.map((token) => ({
        address: token.srcToken as HexString,
        amount: token.amount,
      })),
      chainId,
      multicallAddress,
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

  private static sendHyperLiquidTransaction = async (
    signer: Signer | WalletClient,
    txnParams: { from: string; to: string; data: string; value: string; gasLimit?: string },
    txnData: TradeBuildTxnResponse,
    chainId: number,
    additionalInfo: AdditionalInfo | undefined,
    updatedQuotes: Record<string, string>,
  ) => {
    let txnDetails;

    if (chainId === exclusiveChainIds.hyperLiquid) {
      const providerData = additionalInfo ? Object.values(additionalInfo)[0] : null;
      const typedData =
        providerData && 'typedData' in (providerData as { typedData: CustomTypedDataParams })
          ? (providerData as { typedData: CustomTypedDataParams }).typedData
          : null;

      if (!additionalInfo || !typedData) {
        return {
          status: TxnStatus.error,
          errorMsg: 'Missing additional info for HyperLiquid transaction',
          code: StatusCodes.Error,
        };
      }

      const resp = await signCustomTypedData({
        signer,
        account: txnParams.from as HexString,
        domain: typedData.domain,
        types: typedData.types,
        message: typedData.message,
        primaryType: typedData.primaryType,
      });

      if (resp.status !== TxnStatus.success) {
        throw new Error('Failed to sign transaction');
      }
      txnDetails = resp.data?.signature;
    } else {
      const resp = await this.sendTransaction(signer, txnParams, chainId, additionalInfo, updatedQuotes);
      if (resp.status !== TxnStatus.success) {
        throw new Error('Failed to sign transaction');
      }
      txnDetails = resp.txnHash;
    }

    const txResp = await broadcastTradeTx({
      chainId,
      txData: txnDetails as HexString,
      txId: txnData.txId,
    });

    if (txResp.status !== TxnStatus.success) {
      throw new Error('Failed to broadcast or save transaction');
    }

    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      txnHash: txResp.txnHash as HexString,
      additionalInfo,
      updatedQuotes,
    };
  };

  public static buildAndSendTransaction = async ({
    request,
    signer,
    txnData,
    multicallAddress,
    batchTransaction = false,
    rpcUrls,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    txnData?: TradeBuildTxnResponse;
    batchTransaction: boolean;
    multicallAddress?: HexString;
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
      const txnParams = { from, to: to as HexString, data, value: value as string, gasLimit: gasLimit as string };

      if ([chainId, ...request.data.map((e) => e.toChain)].some((chain) => chain === exclusiveChainIds.hyperLiquid)) {
        return this.sendHyperLiquidTransaction(signer, txnParams, buildTxnResponseData, chainId, additionalInfo, updatedQuotes);
      }
      // Handle ethers signer (no batching support)
      if (batchTransaction && !isTypeSigner(signer)) {
        return this.sendTxnWithBatch(request, signer, txnParams, chainId, additionalInfo, updatedQuotes, multicallAddress, rpcUrls);
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
  public static buildGaslessTxAndSignPermit = async ({
    request,
    signer,
    rpcUrls,
    spender,
    txnData,
    txnStatusCallback,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    rpcUrls: string[];
    spender: HexString;
    txnData?: GaslessTradeBuildTxnResponse;
    txnStatusCallback?: (status: TxnStatus) => void;
  }): Promise<DZapTransactionResponse> => {
    try {
      const chainId = request.fromChain;

      let buildTxnResponseData: GaslessTradeBuildTxnResponse;
      if (txnData) {
        buildTxnResponseData = txnData;
      } else {
        buildTxnResponseData = await fetchTradeBuildTxnData({
          ...request,
          gasless: true,
        });
      }

      const permitType = request.hasPermit2ApprovalForAllTokens ? PermitTypes.PermitBatchWitnessTransferFrom : PermitTypes.EIP2612Permit;

      const txId = buildTxnResponseData.txId;
      const resp = await PermitTxnHandler.signGaslessUserIntent({
        tokens: request.data.map((req, index) => {
          return {
            address: req.srcToken as HexString,
            amount: req.amount,
            index: index,
          };
        }),
        chainId,
        rpcUrls,
        sender: request.sender,
        spender,
        permitType,
        signer,
        gasless: true,
        txId,
        service: 'trade',
        contractVersion: ContractVersion.v2,
        ...buildTxnResponseData.transaction,
      });

      if (resp.status === TxnStatus.success && resp.data) {
        if (txnStatusCallback) {
          txnStatusCallback(TxnStatus.waitingForExecution);
        }
        const permit =
          resp.data.type === PermitTypes.EIP2612Permit
            ? {
                permitData: request.data.map((req) => {
                  return {
                    token: req.srcToken as HexString,
                    amount: req.amount,
                    permit: req.permitData as HexString,
                  };
                }),
                gaslessIntentNonce: resp.data.nonce?.toString(),
                gaslessIntentSignature: resp.data.signature,
                gaslessIntentDeadline: resp.data.deadline?.toString(),
              }
            : {
                batchPermitData: resp.data.batchPermitData,
              };
        const gaslessTxResp: {
          status: TxnStatus;
          txnHash: HexString;
        } = await executeGaslessTxnData({
          chainId: request.fromChain,
          txId,
          permit,
        });
        if (gaslessTxResp.status !== TxnStatus.success) {
          throw new Error('Failed to execute gasless transaction');
        }
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: gaslessTxResp.txnHash as HexString,
        };
      }
      throw new Error('Gasless Transaction Failed');
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
