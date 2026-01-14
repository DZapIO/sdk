import type { CancelTokenSource } from 'axios';
import Axios from 'axios';
import type { Signer } from 'ethers';
import type { WalletClient } from 'viem';

import { ZapApiClient } from '../../api';
import { ZAP_STEP_ACTIONS } from '../../constants';
import { StatusCodes, TxnStatus } from '../../enums';
import type { BroadcastTxParams, BroadcastTxResponse, DZapTransactionResponse, HexString } from '../../types';
import type {
  ZapBuildTxnRequest,
  ZapBuildTxnResponse,
  ZapChains,
  ZapPoolDetails,
  ZapPoolDetailsRequest,
  ZapPoolsRequest,
  ZapPoolsResponse,
  ZapPositionsRequest,
  ZapPositionsResponse,
  ZapProviders,
  ZapQuoteRequest,
  ZapQuoteResponse,
  ZapStatusRequest,
  ZapStatusResponse,
  ZapTransactionStep,
} from '../../types/zap';
import type { ZapEvmTxnDetails, ZapStep } from '../../types/zap/step';
import { handleViemTransactionError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { ChainsService } from '../chains';
import { TransactionsService } from '../transactions';

/**
 * ZapService handles all zap-related operations including quotes, transaction building, execution, and pool management.
 */
export class ZapService {
  private cancelTokenSource: CancelTokenSource | null = null;

  constructor() {}

  /**
   * Fetches pricing and routing information for zap operations without building full transactions.
   * This provides cost estimates, optimal routes, and feasibility analysis for complex multi-step operations.
   * Use this to show users expected outcomes before committing to a zap transaction.
   *
   * @param request - The zap quote request containing operation parameters and constraints
   * @returns Promise resolving to zap quote with pricing, routing, and feasibility information
   *
   * @example
   * ```typescript
   * const zapQuote = await client.zap.getQuote({
   *   srcChainId: 1,
   *   destChainId: 1,
   *   account: '0x...',
   *   srcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *   destToken: '0x...',
   *   amount: '1000000',
   *   recipient: '0x...',
   *   slippage: 1
   * });
   *
   * console.log('Expected output:', zapQuote.estimatedOutput);
   * console.log('Route steps:', zapQuote.route);
   * ```
   */
  public async getQuote(request: ZapQuoteRequest): Promise<ZapQuoteResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapQuoteResponse = (await ZapApiClient.fetchZapQuote(request, this.cancelTokenSource.token)).data;
    return route;
  }

  /**
   * Builds comprehensive transaction data for zap operations without executing them.
   * This method prepares all necessary steps, routing information, and transaction parameters
   * for complex multi-protocol interactions. The resulting data can be used with the execute method.
   *
   * @param request - The zap build request containing operation parameters and preferences
   * @returns Promise resolving to complete zap transaction data with execution steps
   *
   * @example
   * ```typescript
   * const zapTxData = await client.zap.buildTxn({
   *   srcChainId: 1,
   *   destChainId: 1,
   *   account: '0x...',
   *   srcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
   *   destToken: '0x...', // LP token or protocol-specific token
   *   amount: '1000000',
   *   recipient: '0x...',
   *   refundee: '0x...',
   *   slippage: 1
   * });
   *
   * console.log('Zap steps:', zapTxData.steps);
   * ```
   */
  public async buildTxn(request: ZapBuildTxnRequest): Promise<ZapBuildTxnResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapBuildTxnResponse = (await ZapApiClient.fetchZapBuildTxnData(request, this.cancelTokenSource.token)).data;
    return route;
  }

  /**
   * Executes a multi-step zap transaction using pre-built transaction steps or building from request.
   * Zap operations typically involve multiple protocol interactions (swaps, liquidity provision, staking)
   * combined into a single atomic transaction for improved user experience and gas efficiency.
   *
   * @param params - Configuration object for zap execution
   * @param params.request - The zap build request containing operation parameters
   * @param params.signer - The wallet signer to sign and execute the transaction
   * @param params.steps - Optional array of pre-built transaction steps (if not provided, will build from request)
   * @returns Promise resolving to zap transaction execution result
   *
   * @example
   * ```typescript
   * // Execute zap with request (will build and execute)
   * const zapResult = await client.zap.execute({
   *   request: {
   *     srcChainId: 1,
   *     destChainId: 1,
   *     srcToken: '0x...',
   *     destToken: '0x...',
   *     amount: '1000000',
   *     account: '0x...'
   *   },
   *   signer: walletClient
   * });
   *
   * // Execute zap with pre-built steps
   * const zapResult2 = await client.zap.execute({
   *   request: zapRequest,
   *   steps: zapBuild.steps,
   *   signer: walletClient
   * });
   * ```
   */
  public async execute({ request, steps, signer }: { request: ZapBuildTxnRequest; signer: WalletClient | Signer; steps?: ZapTransactionStep[] }) {
    return await this.executeZap({
      request,
      steps,
      signer,
    });
  }

  /**
   * Fetches the current execution status of a zap transaction.
   * Zap transactions involve multiple steps and this method provides detailed progress information
   * including which steps have completed and any potential issues encountered.
   *
   * @param request - The zap transaction status request containing transaction identification
   * @returns Promise resolving to detailed zap transaction status information
   *
   * @example
   * ```typescript
   * const zapStatus = await client.zap.getStatus({
   *   chainId: '1',
   *   txnHash: '0x...'
   * });
   *
   * console.log('Zap status:', zapStatus.status);
   * console.log('Completed steps:', zapStatus.completedSteps);
   * console.log('Current step:', zapStatus.currentStep);
   * ```
   */
  public async getStatus(request: ZapStatusRequest): Promise<ZapStatusResponse> {
    const status: ZapStatusResponse = (await ZapApiClient.fetchZapTxnStatus(request)).data;
    return status;
  }

  /**
   * Fetches user's zap positions across different protocols and pools on a specific blockchain.
   * Positions include active liquidity provision, staking, farming, and other protocol-specific investments.
   *
   * @param request - The positions request containing user account and filtering parameters
   * @returns Promise resolving to user's positions data including values, rewards, and metadata
   *
   * @example
   * ```typescript
   * // Get all positions for a user on Ethereum
   * const positions = await client.zap.getPositions({
   *   account: '0x...',
   *   chainId: 1,
   *   provider: 'uniswap'
   * });
   *
   * // Process positions
   * positions.forEach(position => {
   *   console.log(`Protocol: ${position.protocol}`);
   *   console.log(`Value: ${position.totalValue}`);
   *   console.log(`APY: ${position.apy}`);
   * });
   * ```
   */
  public async getPositions(request: ZapPositionsRequest): Promise<ZapPositionsResponse> {
    return (await ZapApiClient.fetchZapPositions(request)).data;
  }

  /**
   * Fetches available liquidity pools and investment opportunities for zap operations.
   * This method returns pools from various protocols where users can provide liquidity,
   * stake tokens, or participate in yield farming strategies.
   *
   * @param request - The pools request containing filtering parameters like chain and provider
   * @returns Promise resolving to available pools with metadata, APY, TVL, and other relevant information
   *
   * @example
   * ```typescript
   * // Get Uniswap pools on Ethereum
   * const pools = await client.zap.getPools({
   *   chainId: 1,
   *   provider: 'uniswap',
   *   limit: 50,
   *   offset: 0
   * });
   * ```
   */
  public async getPools(request: ZapPoolsRequest): Promise<ZapPoolsResponse> {
    return (await ZapApiClient.fetchZapPools(request)).data;
  }

  /**
   * Fetches detailed information about a specific liquidity pool or protocol investment opportunity.
   * This method provides comprehensive data including pool composition, fees, historical performance,
   * and other metrics needed for informed investment decisions.
   *
   * @param request - The pool details request containing pool address, chain, and provider information
   * @returns Promise resolving to detailed pool information including composition, fees, performance metrics
   *
   * @example
   * ```typescript
   * // Get detailed information about a specific Uniswap pool
   * const poolDetails = await client.zap.getPoolDetails({
   *   address: '0x...',
   *   chainId: 1,
   *   provider: 'uniswap'
   * });
   *
   * console.log('Pool composition:', poolDetails.tokens);
   * console.log('Current APY:', poolDetails.apy);
   * console.log('Total Value Locked:', poolDetails.tvl);
   * ```
   */
  public async getPoolDetails(request: ZapPoolDetailsRequest): Promise<ZapPoolDetails> {
    return (await ZapApiClient.fetchZapPoolDetails(request)).data;
  }

  /**
   * Fetches configuration information about supported blockchain networks for zap operations.
   *
   * @returns Promise resolving to chain configuration data including supported providers
   *
   * @example
   * ```typescript
   * // Get zap-specific chain configurations
   * const zapChains = await client.zap.getChains();
   *
   * // Check which providers are supported on each chain
   * Object.entries(zapChains).forEach(([chainKey, { name, supportedProviders }]) => {
   *   console.log(`Chain ${chainKey} (${name}): ${supportedProviders.join(', ')}`);
   * });
   * ```
   */
  public async getChains(): Promise<ZapChains> {
    return (await ZapApiClient.fetchZapChains()).data;
  }

  /**
   * Fetches configuration information about supported providers for zap operations.
   *
   * @returns Promise resolving to provider configuration data
   *
   * @example
   * ```typescript
   * // Get all zap providers
   * const allProviders = await client.zap.getProviders();
   *
   * Object.values(allProviders).forEach((provider) => {
   *   console.log(`Provider: ${provider.name}`);
   * });
   * ```
   */
  public async getProviders(): Promise<ZapProviders> {
    return (await ZapApiClient.fetchZapProviders()).data;
  }

  /**
   * Broadcasts a zap transaction to the blockchain.
   *
   * @param request - The zap transaction request containing source chainId, txnData and txId
   * @returns Promise resolving to the broadcasted transaction Hash in response
   *
   * @example
   * ```typescript
   * const result = await client.zap.broadcast({
   *   chainId: 1,
   *   txnData: '0x...',
   *   txId: '0x...'
   * });
   * ```
   */
  public async broadcast(request: BroadcastTxParams): Promise<BroadcastTxResponse> {
    try {
      const response = await ZapApiClient.broadcastZapTx(request);
      if (response.status === TxnStatus.success) {
        return {
          status: TxnStatus.success,
          txnHash: response.data.txnHash,
        };
      }
      throw new Error(response.data?.message || 'Failed to broadcast zap transaction');
    } catch {
      return {
        status: TxnStatus.error,
        message: 'Failed to broadcast zap transaction',
      };
    }
  }

  /**
   * Executes a single zap transaction step.
   * @private
   */
  private async executeStep({
    chainId,
    txnData,
    signer,
  }: {
    chainId: number;
    txnData: ZapEvmTxnDetails;
    signer: Signer | WalletClient;
  }): Promise<DZapTransactionResponse> {
    try {
      const { callData, callTo, value, estimatedGas } = txnData;
      return await TransactionsService.sendTransaction({
        chainId,
        signer,
        to: callTo,
        data: callData,
        value: BigInt(value),
        gasLimit: estimatedGas ? BigInt(estimatedGas) : undefined,
      });
    } catch (error: unknown) {
      logger.error('Zap step execution failed', { service: 'ZapService', method: 'executeStep', chainId, error });
      return handleViemTransactionError({ error });
    }
  }

  /**
   * Approves tokens for zap operations.
   */
  public async approve({ chainId, data, signer }: { chainId: number; data: ZapEvmTxnDetails; signer: Signer | WalletClient }) {
    try {
      const { callData, callTo, value, estimatedGas } = data;
      const publicClient = ChainsService.getPublicClient(chainId);
      const blockNumber = await publicClient.getBlockNumber();
      logger.debug('Zap approval block data', {
        service: 'ZapService',
        method: 'approve',
        chainId,
        blockNumber: blockNumber.toString(),
        callTo,
        value,
        estimatedGas,
      });
      return await TransactionsService.sendTransaction({
        chainId,
        signer,
        to: callTo,
        data: callData,
        value: BigInt(value),
        gasLimit: estimatedGas ? BigInt(estimatedGas) : undefined,
      });
    } catch (error: unknown) {
      logger.error('Zap approval failed', { service: 'ZapService', method: 'approve', chainId, error });
      return handleViemTransactionError({ error });
    }
  }

  /**
   * Executes the complete zap operation with all steps.
   * @private
   */
  private async executeZap({ request, steps, signer }: { request: ZapBuildTxnRequest; steps?: ZapStep[]; signer: Signer | WalletClient }): Promise<
    | {
        status: TxnStatus.success;
        code: StatusCodes | number;
        txnHash: HexString;
      }
    | DZapTransactionResponse
  > {
    try {
      const { srcChainId: chainId } = request;
      if (!steps || steps.length === 0) {
        const route: ZapBuildTxnResponse = (await ZapApiClient.fetchZapBuildTxnData(request)).data;
        steps = route.steps;
        if (!steps || steps.length === 0) {
          logger.error('No steps found in zap route', {
            service: 'ZapService',
            method: 'executeZap',
            chainId,
            srcToken: request.srcToken,
            destToken: request.destToken,
          });
          return {
            status: TxnStatus.error,
            code: StatusCodes.FunctionNotFound,
            errorMsg: 'No steps found in the zap route.',
          };
        }
      }
      let txnHash: HexString | undefined;
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.action === ZAP_STEP_ACTIONS.execute) {
          const result = await this.executeStep({ chainId, txnData: step.data as ZapEvmTxnDetails, signer });
          if (result.status !== TxnStatus.success) {
            return result;
          }
          txnHash = result.txnHash as HexString;
        }
      }

      if (!txnHash) {
        logger.error('No execute steps found in zap route', {
          service: 'ZapService',
          method: 'executeZap',
          chainId,
          stepsCount: steps.length,
        });
        return {
          status: TxnStatus.error,
          code: StatusCodes.FunctionNotFound,
          errorMsg: 'No execute steps found in the zap route.',
        };
      }

      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
        txnHash,
      };
    } catch (error: unknown) {
      logger.error('Zap execution failed', { service: 'ZapService', method: 'executeZap', chainId: request.srcChainId, error });
      return handleViemTransactionError({ error });
    }
  }
}
