import { AvailableDZapServices, BridgeParamsRequest, BridgeParamsResponse, DZapTransactionResponse, HexString, SwapParamsRequest } from '../types';
import { StatusCodes, TxnStatus } from 'src/enums';
import { contractAddress, zkSyncChainId } from 'src/constants/contract';
import { fetchBridgeParams, fetchSwapParams } from 'src/api';
import { getDZapAbi, isTypeSigner, viemChainsById } from '../utils';
import { handleViemTransactionError, isAxiosError } from '../utils/errors';

import { CURRENT_VERSION } from 'src/utils/contract';
import { Services } from 'src/constants';
import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { appEnv } from 'src/config';

class ContractHandler {
  private static instance: ContractHandler;
  // private constructor() {}

  public static getInstance(): ContractHandler {
    if (!ContractHandler.instance) {
      ContractHandler.instance = new ContractHandler();
    }
    return ContractHandler.instance;
  }

  public getDZapContractAddress = ({ chainId, service }: { chainId: number; service: AvailableDZapServices }) => {
    return contractAddress[appEnv as string][service][CURRENT_VERSION[service]]?.address[
      chainId === zkSyncChainId ? 'zkSync' : 'otherChains'
    ] as HexString;
  };

  public async handleSwap({
    chainId,
    request,
    signer,
  }: {
    chainId: number;
    request: SwapParamsRequest;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> {
    const abi = getDZapAbi(Services.BatchSwap);
    try {
      const { data: paramResponseData } = await fetchSwapParams(request);
      const {
        transactionRequest: { data, from, to, value, gasLimit },
      } = paramResponseData;
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
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: viemChainsById[chainId],
          account: from as HexString,
          to: to as HexString,
          data: data as HexString,
          value: BigInt(value),
          gasLimit,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash,
        };
      }
    } catch (error: any) {
      console.log({ error });
      if (isAxiosError(error)) {
        if (error?.response?.status === StatusCodes.SimulationFailure) {
          return {
            status: TxnStatus.error,
            errorMsg: 'Simulation Failed',
            error: (error.response?.data as any).data.errMsg,
            code: error.response.status,
          };
        }
        return {
          status: TxnStatus.error,
          errorMsg: 'Params Failed: ' + JSON.stringify((error?.response?.data as any)?.message),
          error: error?.response?.data ?? error,
          code: error?.response?.status ?? StatusCodes.Error,
        };
      }
      return handleViemTransactionError({ abi, error });
    }
  }

  public async handleBridge({
    chainId,
    request,
    signer,
  }: {
    chainId: number;
    request: BridgeParamsRequest[];
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> {
    const abi = getDZapAbi(Services.CrossChain);
    try {
      const paramResponseData = (await fetchBridgeParams(request)) as BridgeParamsResponse;
      const { data, from, to, value, gasLimit, additionalInfo } = paramResponseData;
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
        };
      } else {
        console.log('Using viem walletClient.');
        const txnHash = await signer.sendTransaction({
          chain: viemChainsById[chainId],
          account: from as HexString,
          to: to as HexString,
          data: data as HexString,
          value: BigInt(value),
          gasLimit,
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
            error: (error.response?.data as any).data.errMsg,
            code: error.response.status,
          };
        }
        return {
          status: TxnStatus.error,
          errorMsg: 'Params Failed: ' + JSON.stringify((error?.response?.data as any)?.message),
          error: error?.response?.data ?? error,
          code: error?.response?.status ?? StatusCodes.Error,
        };
      }
      return handleViemTransactionError({ abi, error });
    }
  }
}

export default ContractHandler;
