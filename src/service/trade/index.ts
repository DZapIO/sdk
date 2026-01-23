import Decimal from 'decimal.js';
import type { Signer } from 'ethers';
import type { TransactionReceipt, WalletClient } from 'viem';

import { TradeApiClient } from '../../api';
import { config } from '../../config';
import { Services } from '../../constants';
import { exclusiveChainIds } from '../../constants/chains';
import { PermitTypes } from '../../constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../../enums';
import type {
  AdditionalInfo,
  AvailableDZapServices,
  BroadcastTxParams,
  BroadcastTxResponse,
  CalculatePointsRequest,
  ChainData,
  DZapTransactionResponse,
  GaslessTradeBuildTxnResponse,
  HexString,
  TradeBuildTxnRequest,
  TradeBuildTxnResponse,
  TradeQuotesRequest,
  TradeQuotesResponse,
  TradeStatusResponse,
} from '../../types';
import type { CustomTypedDataParams } from '../../types/permit';
import { isEthersSigner } from '../../utils';
import { calculateAmountUSD, calculateNetAmountUsd, updateFee, updatePath } from '../../utils/amount';
import { parseError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { ApprovalsService } from '../approvals';
import { ChainsService } from '../chains';
import type { ContractsService } from '../contracts';
import { SwapDecoder } from '../decoder';
import type { PriceService } from '../price';
import { priceProviders } from '../price/types/IPriceProvider';
import { SignatureService } from '../signature';
import { TransactionsService } from '../transactions';

/**
 * TradeService handles all trade-related operations including swaps, bridges, quotes, and transaction execution.
 */
export class TradeService {
  constructor(
    private priceService: PriceService,
    private chainsService: ChainsService,
    private contractsService: ContractsService,
    private approvalsService: ApprovalsService,
  ) {}

  /**
   * Fetches the best available quotes for trade operations including swaps and bridges.
   * Quotes include pricing information, routes, fees, and estimated execution times.
   * The response includes price data updated with the latest market rates.
   *
   * @param request - The quotes request containing trade parameters and preferences
   * @returns Promise resolving to quotes response with available routes and pricing
   *
   * @example
   * ```typescript
   * const quotes = await client.trade.getQuotes({
   *   fromChain: 1,
   *   data: [{
   *     amount: '1000000', // 1 USDC
   *     srcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *     destToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
   *     srcDecimals: 6,
   *     destDecimals: 18,
   *     toChain: 42161,
   *     slippage: 1
   *   }],
   *   account: '0x...'
   * });
   * ```
   */
  public async getQuotes(request: TradeQuotesRequest): Promise<TradeQuotesResponse> {
    const quotes: TradeQuotesResponse = await TradeApiClient.fetchTradeQuotes(request);
    const chainConfig = await this.chainsService.getConfig();
    if (chainConfig === null) {
      return quotes;
    }
    return this.updateQuotes(quotes, request, chainConfig);
  }

  /**
   * Builds transaction data for trade operations without executing the transaction.
   * This prepares all necessary transaction parameters including calldata, gas estimates, and routing information.
   * Use this when you want to review transaction details before execution or handle signing separately.
   *
   * @param request - The build transaction request containing trade details and execution parameters
   * @returns Promise resolving to complete transaction data ready for signing and execution
   *
   * @example
   * ```typescript
   * const txData = await client.trade.buildTxn({
   *   fromChain: 1,
   *   sender: '0x...',
   *   refundee: '0x...',
   *   data: [{
   *     amount: '1000000',
   *     srcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *     destToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
   *     protocol: 'uniswap',
   *     recipient: '0x...',
   *     slippage: 1
   *   }]
   * });
   * ```
   */
  public async buildTxn(request: TradeBuildTxnRequest): Promise<TradeBuildTxnResponse> {
    return await TradeApiClient.fetchTradeBuildTxnData(request);
  }

  /**
   * Executes a complete trade operation (swap/bridge) with transaction building and sending.
   * This is a convenience method that combines building and executing a transaction in one call.
   * If txnData is provided, it skips the build step and directly executes the transaction.
   * If txnData is not provided, it first builds the transaction using the request data, then executes it.
   *
   * @param params - Configuration object for the trade operation
   * @param params.request - The build transaction request containing trade details (tokens, amounts, etc.)
   * @param params.signer - The wallet signer (ethers Signer or viem WalletClient) to sign and send the transaction
   * @param params.txnData - Optional pre-built transaction data. If provided, skips the build step
   * @param params.batchTransaction - Optional flag to enable batch transaction. If true, the transaction will be sent as a batch transaction with EIP-5792.
   * @param params.rpcUrls - Optional custom RPC URLs for blockchain interactions
   * @returns Promise resolving to the transaction execution result
   *
   * @example
   * ```typescript
   * const result = await client.trade.execute({
   *   request: {
   *     fromChain: 1,
   *     sender: '0x...',
   *     data: [{
   *       amount: '1000000',
   *       srcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *       destToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
   *     }]
   *   },
   *   signer: walletClient
   * });
   * ```
   */
  public async execute({
    request,
    signer,
    txnData,
    batchTransaction = false,
    rpcUrls,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    txnData?: TradeBuildTxnResponse;
    batchTransaction?: boolean;
    rpcUrls?: string[];
  }) {
    const chainConfig = await this.chainsService.getConfig();

    return await this.buildAndSendTransaction({
      request,
      signer,
      txnData,
      batchTransaction,
      multicallAddress: chainConfig?.[request.fromChain]?.multicallAddress,
      rpcUrls,
    });
  }

  /**
   * Executes a complete gasless trade operation (swap/bridge) with transaction building and sending.
   * This is a convenience method that combines building and executing a transaction with permit in one call.
   * If txnData is provided, it skips the build step and directly executes the transaction.
   * If txnData is not provided, it first builds the transaction using the request data, then executes it.
   *
   * @param params - Configuration object for the trade operation
   * @param params.request - The build transaction request containing trade details (tokens, amounts, etc.)
   * @param params.signer - The wallet signer (ethers Signer or viem WalletClient) to sign and send the transaction
   * @param params.txnData - Optional pre-built gasless transaction data. If provided, skips the build step
   * @returns Promise resolving to the transaction execution result
   *
   * @example
   * ```typescript
   * const result = await client.trade.executeGasless({
   *   request: {
   *     integratorId: 'dzap',
   *     fromChain: 1,
   *     sender: '0x...',
   *     refundee: '0x...',
   *     gasless: true,
   *     data: [{
   *       amount: '1000000',
   *       srcToken: '0xA0b8...eB48',
   *       destToken: '0xC02a...6Cc2',
   *     }]
   *   },
   *   signer: walletClient,
   * });
   * ```
   */
  public async executeGasless({
    request,
    signer,
    txnData,
    txnStatusCallback,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    txnData?: GaslessTradeBuildTxnResponse;
    txnStatusCallback: (status: TxnStatus) => void;
  }) {
    const spender = (await this.contractsService.getAddress({ chainId: request.fromChain, service: Services.trade })) as HexString;
    return await this.buildGaslessTxAndSignPermit({
      request,
      signer,
      rpcUrls: config.getRpcUrlsByChainId(request.fromChain),
      spender,
      txnData,
      txnStatusCallback,
    });
  }

  /**
   * Fetches the current status of trade transactions including swaps and bridges.
   * Can check single or multiple transactions and provides detailed execution status.
   * For cross-chain transactions, this tracks the complete bridge process across both chains.
   *
   * @param params - Configuration object for status checking
   * @param params.txHash - Transaction hash for single transaction status (requires chainId)
   * @param params.txIds - Comma-separated list of transaction IDs in format "chainId-txHash" for multiple transactions
   * @param params.chainId - Chain ID for single transaction status (requires txHash)
   * @returns Promise resolving to status response(s) with transaction state and details
   *
   * @example
   * ```typescript
   * // Single transaction status
   * const status = await client.trade.getStatus({
   *   txHash: '0x123...',
   *   chainId: 1
   * });
   *
   * // Multiple transactions status
   * const multiStatus = await client.trade.getStatus({
   *   txIds: '1-0x123...,42161-0x456...'
   * });
   * ```
   */
  public getStatus({
    txHash,
    txIds,
    chainId,
  }: {
    txHash?: string;
    txIds?: string;
    chainId?: number;
  }): Promise<TradeStatusResponse | Record<string, TradeStatusResponse>> {
    return TradeApiClient.fetchStatus({ txHash, txIds, chainId });
  }

  /**
   * Broadcasts a trade transaction to the blockchain.
   *
   * @param request - The trade transaction request containing source chainId, txnData and txId
   * @returns Promise resolving to the broadcasted transaction Hash in response
   *
   * @example
   * ```typescript
   * const result = await client.trade.broadcast({
   *   chainId: 1,
   *   txnData: '0x...',
   *   txId: '0x...'
   * });
   * ```
   */
  public async broadcast(request: BroadcastTxParams): Promise<BroadcastTxResponse> {
    return await TradeApiClient.broadcastTradeTx(request);
  }

  /**
   * Calculates DZap reward points for completed trade operations including swaps and bridges.
   * Points are awarded based on transaction volume, frequency, and other protocol-specific metrics.
   * These points may be used for protocol governance, rewards, or other incentive programs.
   *
   * @param request - The points calculation request containing transaction details and user information
   * @returns Promise resolving to calculated points information
   *
   * @example
   * ```typescript
   * const pointsResult = await client.trade.calculatePoints({
   *   userAddress: '0x...',
   *   transactionHash: '0x...',
   *   chainId: 1,
   * });
   *
   * console.log('Earned points:', pointsResult.points);
   * ```
   */
  public async calculatePoints(request: CalculatePointsRequest): Promise<{ points: number }> {
    return await TradeApiClient.fetchCalculatedPoints(request);
  }

  /**
   * Decodes and interprets transaction receipt data for DZap trade operations.
   * This method parses transaction logs and events to provide human-readable transaction details.
   * Useful for analyzing completed transactions and extracting structured data.
   *
   * @param params - Configuration object for transaction decoding
   * @param params.data - The transaction receipt containing logs and events to decode
   * @param params.service - The DZap service type that generated the transaction
   * @param params.chainId - The blockchain network ID where the transaction occurred
   * @returns Promise resolving to decoded transaction data with structured information
   *
   * @example
   * ```typescript
   * const decodedData = await client.trade.decodeTxn({
   *   data: transactionReceipt,
   *   service: 'swap',
   *   chainId: 1
   * });
   *
   * console.log('Decoded transaction:', decodedData);
   * ```
   */
  public async decodeTxn({ data, service, chainId }: { data: TransactionReceipt; service: AvailableDZapServices; chainId: number }) {
    const publicClient = ChainsService.getPublicClient(chainId, config.getRpcUrlsByChainId(chainId));
    const [chainConfig, transactionData] = await Promise.all([
      this.chainsService.getConfig(),
      publicClient.getTransaction({
        hash: data.transactionHash,
      }),
    ]);
    if (chainConfig === null || chainConfig?.[chainId] == null) {
      throw new Error('Chains config not found');
    }
    const decoder = new SwapDecoder();
    return decoder.decodeTransactionData(transactionData, data, service, chainConfig[chainId]);
  }

  /**
   * Sends a transaction using either ethers or viem signer.
   * @private
   */
  private async sendTransaction(
    signer: Signer | WalletClient,
    txnParams: { from: string; to: string; data: string; value: string; gasLimit?: string },
    chainId: number,
    additionalInfo: AdditionalInfo | undefined,
    updatedQuotes: Record<string, string>,
  ): Promise<DZapTransactionResponse> {
    const result = await TransactionsService.sendTransaction({
      chainId,
      signer,
      from: txnParams.from as HexString,
      to: txnParams.to as HexString,
      data: txnParams.data as HexString,
      value: txnParams.value,
      gasLimit: txnParams.gasLimit,
    });

    return {
      ...result,
      additionalInfo,
      updatedQuotes,
    };
  }

  /**
   * Sends transaction with batch approvals.
   * @private
   */
  private async sendBatchTxn(
    request: TradeBuildTxnRequest,
    signer: WalletClient,
    txnParams: { from: string; to: string; data: string; value: string },
    chainId: number,
    additionalInfo: AdditionalInfo | undefined,
    updatedQuotes: Record<string, string>,
    multicallAddress?: HexString,
    rpcUrls?: string[],
  ): Promise<DZapTransactionResponse> {
    const approvalBatchCalls = await this.approvalsService.generateApprovalBatchCalls({
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

    const batchCalls = [
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

    const batchResult = await TransactionsService.sendBatchCalls(signer, batchCalls);
    if (!batchResult) {
      return {
        status: TxnStatus.error,
        errorMsg: 'Batch call failed',
        code: StatusCodes.Error,
      };
    }

    logger.info('Waiting for batch transaction completion', {
      service: 'TradeService',
      method: 'executeBatch',
      batchId: batchResult.id,
      chainId,
    });
    const receipt = await TransactionsService.waitForBatchTransactionReceipt(signer, batchResult.id as HexString);
    logger.info('Batch transaction completed', {
      service: 'TradeService',
      method: 'executeBatch',
      chainId,
      txHash: receipt.transactionHash,
      status: receipt.status,
    });
    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      txnHash: receipt.transactionHash as HexString,
      additionalInfo,
      updatedQuotes,
    };
  }

  /**
   * Sends HyperLiquid transaction.
   * @private
   */
  private async sendHyperLiquidTransaction(
    signer: Signer | WalletClient,
    txnParams: { from: string; to: string; data: string; value: string; gasLimit?: string },
    txnData: TradeBuildTxnResponse,
    chainId: number,
    additionalInfo: AdditionalInfo | undefined,
    updatedQuotes: Record<string, string>,
  ) {
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

      const resp = await SignatureService.signCustomTypedData({
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

    const txResp = await TradeApiClient.broadcastTradeTx({
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
  }

  /**
   * Builds and sends a trade transaction.
   * @private
   */
  private async buildAndSendTransaction({
    request,
    signer,
    txnData,
    batchTransaction = false,
    multicallAddress,
    rpcUrls,
  }: {
    request: TradeBuildTxnRequest;
    signer: Signer | WalletClient;
    txnData?: TradeBuildTxnResponse;
    batchTransaction: boolean;
    multicallAddress?: HexString;
    rpcUrls?: string[];
  }): Promise<DZapTransactionResponse> {
    try {
      const chainId = request.fromChain;
      let buildTxnResponseData: TradeBuildTxnResponse;

      // Build transaction data if not provided
      if (txnData) {
        buildTxnResponseData = txnData;
      } else {
        buildTxnResponseData = await TradeApiClient.fetchTradeBuildTxnData(request);
      }

      const { data, from, to, value, gasLimit, additionalInfo, updatedQuotes } = buildTxnResponseData;
      const txnParams = { from, to: to as HexString, data, value: value as string, gasLimit: gasLimit as string };

      if ([chainId, ...request.data.map((e) => e.toChain)].some((chain) => chain === exclusiveChainIds.hyperLiquid)) {
        return this.sendHyperLiquidTransaction(signer, txnParams, buildTxnResponseData, chainId, additionalInfo, updatedQuotes);
      }
      if (batchTransaction && !isEthersSigner(signer)) {
        return this.sendBatchTxn(request, signer, txnParams, chainId, additionalInfo, updatedQuotes, multicallAddress, rpcUrls);
      }
      return this.sendTransaction(signer, txnParams, chainId, additionalInfo, updatedQuotes);
    } catch (error: unknown) {
      logger.error('Trade operation failed', {
        service: 'TradeService',
        method: 'execute',
        chainId: request.fromChain,
        sender: request.sender,
        refundee: request.refundee,
        tradeCount: request.data?.length,
        txnData: txnData,
        request: request.data,
        error,
      });

      return parseError(error, true);
    }
  }

  /**
   * Builds gasless transaction and signs permit.
   * @private
   */
  private async buildGaslessTxAndSignPermit({
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
  }): Promise<DZapTransactionResponse> {
    try {
      const chainId = request.fromChain;

      let buildTxnResponseData: GaslessTradeBuildTxnResponse;
      if (txnData) {
        buildTxnResponseData = txnData;
      } else {
        buildTxnResponseData = await TradeApiClient.fetchTradeBuildTxnData({
          ...request,
          gasless: true,
        });
      }

      const permitType = request.hasPermit2ApprovalForAllTokens ? PermitTypes.PermitBatchWitnessTransferFrom : PermitTypes.EIP2612Permit;

      const txId = buildTxnResponseData.txId;
      const resp = await SignatureService.signGaslessUserIntent({
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
        } = await TradeApiClient.executeGaslessTxnData({
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
    } catch (error: unknown) {
      logger.error('Trade operation failed', {
        service: 'TradeService',
        method: 'executeGasless',
        chainId: request.fromChain,
        sender: request.sender,
        refundee: request.refundee,
        request: request.data,
        txnData: txnData,
        error,
      });

      return parseError(error, true);
    }
  }

  private async updateQuotes(quotes: TradeQuotesResponse, request: TradeQuotesRequest, chainConfig: ChainData): Promise<TradeQuotesResponse> {
    const tokensWithoutPrice: Record<number, Set<string>> = {};

    Object.values(quotes).forEach((quote) => {
      if (quote.tokensWithoutPrice) {
        Object.entries(quote.tokensWithoutPrice).forEach(([chainIdStr, tokens]) => {
          const chainId = Number(chainIdStr);

          if (!tokensWithoutPrice[chainId]) {
            tokensWithoutPrice[chainId] = new Set<string>();
          }
          tokens.forEach((token) => tokensWithoutPrice[chainId].add(token));
        });
      }
    });

    if (Object.keys(tokensWithoutPrice).length === 0) {
      return quotes;
    }
    const tokensPrice: Record<number, Record<string, string | null>> = Object.fromEntries(
      await Promise.all(
        Object.entries(tokensWithoutPrice).map(async ([chainIdStr, tokens]) => {
          const chainId = Number(chainIdStr);
          const tokenAddresses = Array.from(tokens);
          const prices = await this.priceService.getPrices({ chainId, tokenAddresses, chainConfig, notAllowSources: [priceProviders.dZap] });
          return [chainId, prices];
        }),
      ),
    );

    for (const quote of Object.values(quotes)) {
      if (!quote.quoteRates || !Object.keys(quote.quoteRates).length) {
        continue;
      }
      let isSorted = true;
      for (const data of Object.values(quote.quoteRates)) {
        const srcDecimals = data.srcToken.decimals;
        const destDecimals = data.destToken.decimals;
        const toChain = data.destToken.chainId;

        if (!Number(data.srcAmountUSD)) {
          isSorted = false;
          const srcTokenPricePerUnit = tokensPrice[request.fromChain]?.[data.srcToken.address] || '0';
          data.srcAmountUSD = calculateAmountUSD(data.srcAmount, srcDecimals, srcTokenPricePerUnit);
        }
        if (!Number(data.destAmountUSD)) {
          isSorted = false;
          const destTokenPricePerUnit = tokensPrice[toChain]?.[data.destToken.address] || '0';
          data.destAmountUSD = calculateAmountUSD(data.destAmount, destDecimals, destTokenPricePerUnit);
        }
        if (Number(data.srcAmountUSD) && Number(data.destAmountUSD)) {
          const priceImpact = new Decimal(data.destAmountUSD).minus(data.srcAmountUSD).div(data.srcAmountUSD).mul(100);
          data.priceImpactPercent = priceImpact.toFixed(2);
        }
        const { isUpdated, fee } = updateFee(data.fee, tokensPrice);
        isSorted = isSorted && !isUpdated;
        data.fee = fee;
        data.path = updatePath(data, tokensPrice);
      }

      if (Object.keys(quote.tokensWithoutPrice).length !== 0 && isSorted === false) {
        quote.quoteRates = Object.fromEntries(
          Object.entries(quote.quoteRates).sort(([, a], [, b]) => {
            const aNetAmount = calculateNetAmountUsd(a);
            const bNetAmount = calculateNetAmountUsd(b);
            return Number(bNetAmount) - Number(aNetAmount);
          }),
        );
        quote.recommendedSource = Object.keys(quote.quoteRates)[0];
      }
    }

    return quotes;
  }
}
