import { Signer, Wallet } from 'ethers';
import { executeGaslessTxnData, fetchTradeBuildTxnData } from 'src/api';
import { PermitTypes } from 'src/constants/permit';
import { StatusCodes, TxnStatus } from 'src/enums';
import { viemChainsById } from 'src/utils/chains';
import { WalletClient } from 'viem';
import {
  ContractErrorResponse,
  DZapTransactionResponse,
  GaslessTradeBuildTxnResponse,
  HexString,
  TradeBuildTxnRequest,
  TradeBuildTxnResponse,
} from '../types';
import { isTypeSigner } from '../utils';
import { handleViemTransactionError, isAxiosError } from '../utils/errors';
import PermitTxnHandler from './permit';

class TradeTxnHandler {
  public static buildAndSendTransaction = async ({
    request,
    signer,
    txnData,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    txnData?: TradeBuildTxnResponse;
  }): Promise<DZapTransactionResponse> => {
    try {
      const chainId = request.fromChain;
      let buildTxnResponseData: TradeBuildTxnResponse;
      if (txnData) {
        buildTxnResponseData = txnData;
      } else {
        buildTxnResponseData = await fetchTradeBuildTxnData(request);
      }
      const { data, from, to, value, gasLimit, additionalInfo, updatedQuotes } = buildTxnResponseData;
      if (isTypeSigner(signer)) {
        console.log('Using ethers signer.');
        const txnRes = await signer.sendTransaction({
          from,
          to,
          data,
          value,
          gasLimit,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: txnRes.hash as HexString,
          additionalInfo,
          updatedQuotes,
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: viemChainsById[chainId],
          account: from as HexString,
          to: to as HexString,
          data: data as HexString,
          value: BigInt(value),
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash,
          additionalInfo,
        };
      }
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
  }: {
    request: TradeBuildTxnRequest;
    signer: Wallet | WalletClient;
    rpcUrls: string[];
    spender: HexString;
    txnData?: GaslessTradeBuildTxnResponse;
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

      const { swapDataHash, executorFeesHash, txId, adapterDataHash, txType } = buildTxnResponseData;
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
        txType,
        swapDataHash,
        executorFeesHash,
        txId,
        adapterDataHash,
      });

      if (resp.status === TxnStatus.success && resp.data) {
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
          throw new Error('Failed to sign permit');
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
