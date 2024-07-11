import Axios, { CancelTokenSource } from 'axios';
import { Signer } from 'ethers';
import ContractHandler from 'src/contractHandler';
import PermitHandler from 'src/contractHandler/permitHandler';
import { StatusCodes, TxnStatus } from 'src/enums';
import {
  AvailableDZapServices,
  BridgeParamsRequest,
  BridgeParamsResponse,
  BridgeQuoteRequest,
  BridgeQuoteResponse,
  ChainData,
  HexString,
  OtherAvailableAbis,
  SwapData,
  SwapParamsRequest,
  SwapQuoteRequest,
} from 'src/types';
import { getDZapAbi, getOtherAbis, handleDecodeTrxData } from 'src/utils';
import { TransactionReceipt, WalletClient } from 'viem';
import {
  fetchAllSupportedChains,
  fetchAllTokens,
  fetchBridgeParams,
  fetchBridgeQuoteRate,
  fetchQuoteRate,
  fetchSwapParams,
  fetchTokenDetails,
  fetchTokenPrice,
  swapTokensApi,
} from '../api';

class DzapClient {
  private static instance: DzapClient;
  private cancelTokenSource: CancelTokenSource | null = null;
  private contractHandler: ContractHandler;
  private permitHandler: PermitHandler;

  private constructor() {
    this.contractHandler = ContractHandler.getInstance();
    this.permitHandler = PermitHandler.getInstance();
  }

  // Static method to control the access to the singleton instance.
  public static getInstance(): DzapClient {
    if (!DzapClient.instance) {
      DzapClient.instance = new DzapClient();
    }
    return DzapClient.instance;
  }

  public static getDZapAbi(service: AvailableDZapServices) {
    return getDZapAbi(service);
  }
  public static getOtherAbi = (name: OtherAvailableAbis) => {
    return getOtherAbis(name);
  };

  public async getQuoteRate(request: SwapQuoteRequest) {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }

    this.cancelTokenSource = Axios.CancelToken.source();
    return await fetchQuoteRate(request, this.cancelTokenSource.token);
  }

  public async getBridgeQuoteRate(request: BridgeQuoteRequest[]): Promise<BridgeQuoteResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    return await fetchBridgeQuoteRate(request, this.cancelTokenSource.token);
  }

  public async getBridgeParams(request: BridgeParamsRequest[]): Promise<BridgeParamsResponse> {
    return await fetchBridgeParams(request);
  }

  public getSwapParams(request: SwapParamsRequest) {
    return fetchSwapParams(request);
  }

  public getAllSupportedChains(): Promise<ChainData> {
    return fetchAllSupportedChains();
  }

  public async getAllTokens(chainId: number, source?: string, account?: string) {
    return await fetchAllTokens(chainId, source, account);
  }

  public async getTokenDetails(tokenAddress: string, chainId: number) {
    return await fetchTokenDetails(tokenAddress, chainId);
  }

  public async getTokenPrice(tokenAddresses: string[], chainId: number): Promise<Record<string, string>> {
    return await fetchTokenPrice(tokenAddresses, chainId);
  }

  public swapTokens = ({ request, provider }: { request: SwapParamsRequest; provider: Signer }) => {
    return swapTokensApi({ request, provider });
  };

  public async swap({ chainId, request, signer }: { chainId: number; request: SwapParamsRequest; signer: Signer | WalletClient }) {
    return await this.contractHandler.handleSwap({ chainId, request, signer });
  }

  public async bridge({ chainId, request, signer }: { chainId: number; request: BridgeParamsRequest[]; signer: Signer | WalletClient }) {
    return await this.contractHandler.handleBridge({ chainId, request, signer });
  }

  public decodeTrxData({ data, service }: { data: TransactionReceipt; service: AvailableDZapServices }) {
    return handleDecodeTrxData(data, service);
  }

  public getDZapContractAddress = ({ chainId, service }: { chainId: number; service: AvailableDZapServices }) => {
    return this.contractHandler.getDZapContractAddress({ chainId, service });
  };

  public async allowance({
    chainId,
    sender,
    data,
    rpcUrls,
  }: {
    chainId: number;
    sender: HexString;
    data: { srcToken: HexString; amount: bigint }[];
    rpcUrls: string[];
  }) {
    return await this.permitHandler.handleGetAllowance({
      chainId,
      sender,
      data,
      rpcUrls,
    });
  }

  public async approve({
    chainId,
    signer,
    sender,
    rpcUrls,
    data,
    approvalTxnCallback,
  }: {
    chainId: number;
    signer: WalletClient;
    sender: HexString;
    rpcUrls?: string[];
    data: { srcToken: HexString; amountToApprove: bigint }[];
    approvalTxnCallback?: ({
      txnDetails,
      address,
    }: {
      txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
      address: HexString;
    }) => Promise<TxnStatus | void>;
  }) {
    return await this.permitHandler.handleApprove({
      chainId,
      signer,
      sender,
      rpcUrls,
      data,
      approvalTxnCallback,
    });
  }

  public async sign({
    chainId,
    sender,
    data,
    rpcUrls,
    signer,
    service,
    signatureCallback,
  }: {
    chainId: number;
    sender: string;
    data: SwapData[] | BridgeParamsRequest[];
    rpcUrls?: string[];
    service: AvailableDZapServices;
    signer: WalletClient;
    signatureCallback?: () => Promise<void>;
  }) {
    return await this.permitHandler.handleSign({
      chainId,
      sender,
      data,
      rpcUrls,
      signer,
      service,
      signatureCallback,
    });
  }
}

export default DzapClient;
