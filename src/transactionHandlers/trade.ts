import { fetchTradeBuildTxnData } from 'src/api';
import { StatusCodes, TxnStatus } from 'src/enums';
import { TradeBuildTxnRequest, TradeBuildTxnResponse, ContractErrorResponse, DZapTransactionResponse, HexString } from '../types';
import { isTypeSigner } from '../utils';
import { handleViemTransactionError, isAxiosError } from '../utils/errors';

import { Signer } from 'ethers';
import { viemChainsById } from 'src/utils/chains';
import { WalletClient } from 'viem';

class TradeTxnHandler {
  public static buildAndSendTransaction = async ({
    chainId,
    request,
    signer,
    txnData,
  }: {
    chainId: number;
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    txnData?: TradeBuildTxnResponse;
  }): Promise<DZapTransactionResponse> => {
    try {
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
}

export default TradeTxnHandler;
