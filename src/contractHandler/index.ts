import { Signer } from 'ethers';
import { fetchBridgeParams, fetchSwapParams } from 'src/api';
import { appEnv } from 'src/config';
import { Services } from 'src/constants';
import { contractAddress, zkSyncChainId } from 'src/constants/contract';
import { CURRENT_VERSION } from 'src/utils/contract';
import { WalletClient } from 'viem';
import { AvailableDZapServices, BridgeParamsRequest, BridgeParamsResponse, HexString, SwapParamsRequest } from '../types';
import { getDZapAbi, isTypeSigner, viemChainsById } from '../utils';
import { handleTransactionError } from '../utils/errors';
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

  public async handleSwap({ chainId, request, signer }: { chainId: number; request: SwapParamsRequest; signer: Signer | WalletClient }) {
    const abi = getDZapAbi(Services.BatchSwap);
    try {
      const { data: paramResponseData } = await fetchSwapParams(request);
      const {
        transactionRequest: { data, from, to, value, gasLimit },
      } = paramResponseData;
      return await signer.sendTransaction({
        chain: viemChainsById[chainId],
        account: from as HexString,
        to: to as HexString,
        data: data as HexString,
        value: value as bigint,
        gasLimit,
      });
    } catch (error: any) {
      console.log({ error });
      handleTransactionError({ abi, error });
    }
  }

  public async handleBridge({ chainId, request, signer }: { chainId: number; request: BridgeParamsRequest[]; signer: Signer | WalletClient }) {
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
          txnHash: txnRes.hash,
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
          txnHash,
          additionalInfo,
        };
      }
    } catch (error: any) {
      console.log({ error });
      handleTransactionError({ abi, error });
    }
  }
}

export default ContractHandler;
