import { executeGaslessTxnData, fetchTradeBuildTxnData } from 'src/api';
import { StatusCodes, TxnStatus } from 'src/enums';
import { ContractErrorResponse, DZapTransactionResponse, HexString, TradeBuildTxnRequest, TradeBuildTxnResponse } from '../types';
import { isTypeSigner } from '../utils';
import { handleViemTransactionError, isAxiosError } from '../utils/errors';

import { Signer, Wallet } from 'ethers';
import { GaslessTxType, Services } from 'src/constants';
import { PermitTypes } from 'src/constants/permit';
import { viemChainsById } from 'src/utils/chains';
import { WalletClient } from 'viem';
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
    rpcs,
    spender,
  }: {
    request: TradeBuildTxnRequest;
    signer: Wallet | WalletClient;
    rpcs: string[];
    spender: HexString;
  }): Promise<DZapTransactionResponse> => {
    try {
      const chainId = request.fromChain;
      const buildTxnResponseData: {
        data: {
          txId: HexString;
          executorFeesHash: HexString;
          swapDataHash: HexString;
          txType: typeof GaslessTxType.swap;
          encodedData: HexString;
        };
      } = await fetchTradeBuildTxnData({
        ...request,
        gasless: true,
      });

      const { txId, executorFeesHash, swapDataHash, encodedData } = buildTxnResponseData.data;

      const resp = await PermitTxnHandler.signPermit({
        tokens: request.data.map((req, index) => {
          return {
            address: req.srcToken as HexString,
            amount: req.amount,
            index: index,
          };
        }),
        chainId,
        rpcUrls: rpcs,
        sender: request.sender,
        spender,
        permitType: PermitTypes.PermitBatchWitnessTransferFrom,
        signer,
        service: Services.trade,
        gasless: true,
        txType: GaslessTxType.swap,
        swapDataHash,
        executorFeesHash,
        txId,
      });

      if (resp.status === TxnStatus.success && 'batchPermitData' in resp) {
        const gaslessTxResp = await executeGaslessTxnData({
          chainId: request.fromChain,
          encodedData,
          sender: request.sender,
          batchPermitData: resp.batchPermitData as HexString,
        });
        console.log({ gaslessTxResp });
      }
      throw new Error('Unable to sign permit');
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
