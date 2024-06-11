import { Signer } from 'ethers';
import { fetchBridgeParams, fetchSwapParams } from 'src/api';
import { Services } from 'src/constants';
import { WalletClient } from 'viem';
import { BridgeParamsRequest, BridgeParamsResponse, HexString, SwapParamsRequest } from '../types';
import { getDZapAbi, isTypeSigner, wagmiChainsById } from '../utils';
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

  public async handleSwap({ chainId, request, signer }: { chainId: number; request: SwapParamsRequest; signer: Signer | WalletClient }) {
    const abi = getDZapAbi(Services.BatchSwap);
    try {
      const { data: paramResponseData } = await fetchSwapParams(request);
      const {
        transactionRequest: { data, from, to, value, gasLimit },
      } = paramResponseData;
      return await signer.sendTransaction({
        chain: wagmiChainsById[chainId],
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
          chain: wagmiChainsById[chainId],
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
