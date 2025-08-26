import Axios, { CancelTokenSource } from 'axios';
import { Signer } from 'ethers';
import { Services } from 'src/constants';
import { ApprovalModes } from 'src/constants/approval';
import { PermitTypes } from 'src/constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from 'src/enums';
import { PriceService } from 'src/service/price';
import GenericTxnHandler from 'src/transactionHandlers/generic';
import PermitTxnHandler from 'src/transactionHandlers/permit';
import TradeTxnHandler from 'src/transactionHandlers/trade';
import ZapTxnHandler from 'src/transactionHandlers/zap';
import {
  ApprovalMode,
  AvailableDZapServices,
  CalculatePointsRequest,
  Chain,
  ChainData,
  ExecuteTxnData,
  HexString,
  OtherAvailableAbis,
  PermitMode,
  TokenInfo,
  TokenResponse,
  TradeBuildTxnRequest,
  TradeBuildTxnResponse,
  TradeQuotesRequest,
  TradeQuotesResponse,
  TradeStatusResponse,
} from 'src/types';
import { ZapBuildTxnRequest, ZapBuildTxnResponse, ZapQuoteRequest, ZapQuoteResponse, ZapStatusRequest, ZapStatusResponse } from 'src/types/zap';
import { ZapTransactionStep } from 'src/types/zap/step';
import { getDZapAbi, getOtherAbis, handleDecodeTxnData } from 'src/utils';
import { BatchCallParams, sendBatchCalls, waitForBatchTransactionReceipt } from 'src/utils/eip-5792';
import { approveToken, getAllowance } from 'src/utils/erc20';
import { updateTokenListPrices } from 'src/utils/tokens';
import { updateQuotes } from 'src/utils/updateQuotes';
import { TransactionReceipt, WalletClient } from 'viem';
import {
  fetchAllSupportedChains,
  fetchAllTokens,
  fetchBalances,
  fetchCalculatedPoints,
  fetchStatus,
  fetchTokenDetails,
  fetchTradeBuildTxnData,
  fetchTradeQuotes,
  fetchZapBuildTxnData,
  fetchZapQuote,
  fetchZapTxnStatus,
} from '../api';

class DZapClient {
  private static instance: DZapClient;
  private cancelTokenSource: CancelTokenSource | null = null;
  private static chainConfig: ChainData | null = null;
  private priceService;
  public rpcUrlsByChainId: Record<number, string[]> = {};
  private constructor(rpcUrlsByChainId?: Record<number, string[]>) {
    this.priceService = new PriceService();
    if (rpcUrlsByChainId) {
      this.rpcUrlsByChainId = rpcUrlsByChainId;
    }
  }

  /**
   * Returns the singleton instance of DZapClient with optional custom RPC configuration.
   * This ensures only one instance of the client exists throughout the application lifecycle.
   *
   * @param rpcUrlsByChainId - Optional mapping of chain IDs to custom RPC URLs for blockchain interactions
   * @returns The singleton DZapClient instance
   *
   * @example
   * ```typescript
   * // Basic initialization
   * const client = DZapClient.getInstance();
   *
   * // With custom RPC URLs
   * const clientWithRpc = DZapClient.getInstance({
   *   1: ['https://eth.llamarpc.com'],
   *   42161: ['https://arbitrum.llamarpc.com']
   * });
   * ```
   */
  public static getInstance(rpcUrlsByChainId?: Record<number, string[]>): DZapClient {
    if (!DZapClient.instance) {
      DZapClient.instance = new DZapClient(rpcUrlsByChainId);
    }
    return DZapClient.instance;
  }

  /**
   * Fetches and caches all supported blockchain configurations from the DZap protocol.
   * The chain configuration includes contract addresses, supported features, and network details.
   * Results are cached to improve performance on subsequent calls.
   *
   * @returns Promise resolving to a mapping of chain IDs to their complete configuration objects
   *
   * @example
   * ```typescript
   * const chainConfig = await DZapClient.getChainConfig();
   * const ethereumConfig = chainConfig[1]; // Ethereum mainnet config
   * const arbitrumConfig = chainConfig[42161]; // Arbitrum config
   * ```
   */
  public static async getChainConfig(): Promise<ChainData> {
    if (!DZapClient.chainConfig) {
      const data = await fetchAllSupportedChains();
      const chains: ChainData = {};
      data.forEach((chain: Chain) => {
        if (!chains[chain.chainId]) {
          chains[chain.chainId] = chain;
        }
      });
      DZapClient.chainConfig = chains;
    }
    return DZapClient.chainConfig;
  }

  /**
   * Returns the Application Binary Interface (ABI) for a specific DZap service contract.
   * Use this to interact with DZap contracts directly or for custom contract operations.
   *
   * @param service - The DZap service name (swap, bridge, dca, or zap)
   * @returns The ABI array for the specified service contract
   *
   * @example
   * ```typescript
   * const swapAbi = DZapClient.getDZapAbi('swap');
   * const bridgeAbi = DZapClient.getDZapAbi('bridge');
   * ```
   */
  public static getDZapAbi(service: AvailableDZapServices) {
    return getDZapAbi(service);
  }

  /**
   * Returns the Application Binary Interface (ABI) for non-core contracts used by the DZap protocol.
   * This includes contracts like ERC20, Permit2, and other auxiliary contracts.
   *
   * @param name - The contract name to get the ABI for
   * @returns The ABI array for the specified contract
   *
   * @example
   * ```typescript
   * const erc20Abi = DZapClient.getOtherAbi('ERC20');
   * const permit2Abi = DZapClient.getOtherAbi('Permit2');
   * ```
   */
  public static getOtherAbi = (name: OtherAvailableAbis) => {
    return getOtherAbis(name);
  };

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
   * const quotes = await client.getTradeQuotes({
   *   integratorId: 'dzap',
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
  public async getTradeQuotes(request: TradeQuotesRequest): Promise<TradeQuotesResponse> {
    const quotes: TradeQuotesResponse = await fetchTradeQuotes(request);
    const chainConfig = await DZapClient.getChainConfig();
    if (chainConfig === null) {
      return quotes;
    }
    return updateQuotes(quotes, request, this.priceService, chainConfig);
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
   * const txData = await client.buildTradeTxn({
   *   integratorId: 'dzap',
   *   fromChain: 1,
   *   sender: '0x...',
   *   refundee: '0x...',
   *   data: [{
   *     amount: '1000000',
   *     srcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *     destToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
   *     selectedRoute: 'uniswap',
   *     recipient: '0x...',
   *     slippage: 1
   *   }]
   * });
   * ```
   */
  public async buildTradeTxn(request: TradeBuildTxnRequest): Promise<TradeBuildTxnResponse> {
    return await fetchTradeBuildTxnData(request);
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
   * const status = await client.getTradeTxnStatus({
   *   txHash: '0x123...',
   *   chainId: '1'
   * });
   *
   * // Multiple transactions status
   * const multiStatus = await client.getTradeTxnStatus({
   *   txIds: '1-0x123...,42161-0x456...'
   * });
   * ```
   */
  public getTradeTxnStatus({
    txHash,
    txIds,
    chainId,
  }: {
    txHash?: string;
    txIds?: string;
    chainId?: number;
  }): Promise<TradeStatusResponse | Record<string, TradeStatusResponse>> {
    return fetchStatus({ txHash, txIds, chainId });
  }

  /**
   * Fetches all blockchain networks supported by the DZap protocol.
   * Returns comprehensive configuration data including contract addresses, features, and network parameters.
   *
   * @returns Promise resolving to mapping of chain IDs to complete chain configuration objects
   *
   * @example
   * ```typescript
   * const supportedChains = await client.getAllSupportedChains();
   * const chainIds = Object.keys(supportedChains);
   * console.log('Supported chains:', chainIds);
   * ```
   */
  public getAllSupportedChains(): Promise<ChainData> {
    return fetchAllSupportedChains();
  }

  /**
   * Fetches all available tokens for a specific blockchain with optional account-specific data.
   * Token data includes metadata, prices, and optionally user balances.
   * Prices are automatically updated using the integrated price service for accurate market data.
   *
   * @param chainId - The blockchain network ID to fetch tokens for
   * @param source - Optional source identifier for filtered token lists
   * @param account - Optional wallet address to include balance information
   * @returns Promise resolving to token list with metadata and updated pricing information
   *
   * @example
   * ```typescript
   * // Get all tokens on Ethereum
   * const ethTokens = await client.getAllTokens(1);
   *
   * // Get tokens with user balances
   * const tokensWithBalances = await client.getAllTokens(1, undefined, '0x...');
   *
   * // Get tokens from specific source
   * const curatedTokens = await client.getAllTokens(1, 'coingecko');
   * ```
   */
  public async getAllTokens(chainId: number, source?: string, account?: string) {
    try {
      const [tokensResult, chainConfigResult] = await Promise.allSettled([fetchAllTokens(chainId, source, account), DZapClient.getChainConfig()]);

      const tokens = tokensResult.status === 'fulfilled' ? tokensResult.value : {};
      const chainConfig = chainConfigResult.status === 'fulfilled' ? chainConfigResult.value : null;

      if (!chainConfig) return tokens;

      return await updateTokenListPrices(tokens, chainId, chainConfig, this.priceService);
    } catch (error) {
      console.error('Error fetching or updating tokens:', error);
      return {};
    }
  }

  /**
   * Fetches comprehensive details for a specific token on a blockchain network.
   * Can include token metadata, current market price, and user-specific balance information.
   *
   * @param tokenAddress - The contract address of the token to fetch details for
   * @param chainId - The blockchain network ID where the token exists
   * @param account - Optional wallet address to include balance information
   * @param includeBalance - Optional flag to include user balance data
   * @param includePrice - Optional flag to include current market price
   * @returns Promise resolving to detailed token information object
   *
   * @example
   * ```typescript
   * // Get basic token details
   * const tokenInfo = await client.getTokenDetails(
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
   *   1 // Ethereum
   * );
   *
   * // Get token details with balance and price
   * const fullTokenInfo = await client.getTokenDetails(
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *   1,
   *   '0x...', // user address
   *   true, // include balance
   *   true  // include price
   * );
   * ```
   */
  public async getTokenDetails(
    tokenAddress: string,
    chainId: number,
    account?: string,
    includeBalance?: boolean,
    includePrice?: boolean,
  ): Promise<TokenInfo> {
    return await fetchTokenDetails(tokenAddress, chainId, account, includeBalance, includePrice);
  }

  /**
   * Fetches comprehensive details for multiple tokens on a blockchain network.
   * Can include token metadata, current market price, and user-specific balance information.
   *
   * @param tokenAddresses - Array of contract addresses of the tokens to fetch details for
   * @param chainId - The blockchain network ID where the tokens exist
   * @param account - Optional wallet address to include balance information
   * @param includeBalance - Optional flag to include user balance data
   * @param includePrice - Optional flag to include current market price
   * @returns Promise resolving to detailed token information object
   *
   * @example
   * ```typescript
   * // Get basic token details
   * const tokenInfo = await client.getTokenDetails(
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
   *   1 // Ethereum
   * );
   *
   * // Get token details with balance and price
   * const fullTokenInfo = await client.getTokenDetails(
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
   *   1,
   *   '0x...', // user address
   *   true, // include balance
   *   true  // include price
   * );
   * ```
   */

  public async getTokensDetails(
    tokenAddresses: string[],
    chainId: number,
    account?: string,
    includeBalance?: boolean,
    includePrice?: boolean,
  ): Promise<Record<string, TokenInfo>> {
    return await fetchTokenDetails(tokenAddresses, chainId, account, includeBalance, includePrice);
  }

  /**
   * Fetches current market prices for multiple tokens on a specific blockchain.
   * Utilizes integrated price providers to ensure accurate and up-to-date pricing information.
   *
   * @param tokenAddresses - Array of token contract addresses to fetch prices for
   * @param chainId - The blockchain network ID where the tokens exist
   * @returns Promise resolving to mapping of token addresses to their current prices (or null if unavailable)
   *
   * @example
   * ```typescript
   * const prices = await client.getTokenPrices([
   *   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
   *   '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
   * ], 1);
   *
   * console.log('USDC price:', prices['0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48']);
   * console.log('WETH price:', prices['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2']);
   * ```
   */
  public async getTokenPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, string | null>> {
    const chainConfig = await DZapClient.getChainConfig();
    return await this.priceService.getPrices({ chainId, tokenAddresses, chainConfig });
  }

  /**
   * Executes a complete trade operation (swap/bridge) with automatic transaction building and sending.
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
   * // Execute a swap trade
   * const result = await dZapClient.trade({
   *   request: {
   *     integratorId: 'dzap',
   *     fromChain: 1,
   *     sender: '0x...',
   *     data: [{
   *       amount: '1000000', // 1 USDC
   *       srcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
   *       destToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
   *       // ... other trade parameters
   *     }]
   *   },
   *   signer: walletClient
   * });
   * ```
   */
  public async trade({
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
    return await TradeTxnHandler.buildAndSendTransaction({ request, signer, txnData, batchTransaction, rpcUrls });
  }

  /**
   * Sends a pre-built transaction using the provided signer and transaction data.
   * This method handles the actual blockchain interaction for transaction execution.
   * Use this when you have already built transaction data and want to execute it.
   *
   * @param params - Configuration object for transaction sending
   * @param params.chainId - The blockchain network ID where the transaction will be executed
   * @param params.signer - The wallet signer (ethers Signer or viem WalletClient) to sign and send the transaction
   * @param params.txnData - Complete transaction data including calldata, value, and gas parameters
   * @returns Promise resolving to the transaction execution result
   *
   * @example
   * ```typescript
   * const result = await client.sendTransaction({
   *   chainId: 1,
   *   signer: walletClient,
   *   txnData: {
   *     to: '0x...',
   *     data: '0x...',
   *     value: '0',
   *     gasLimit: '21000'
   *   }
   * });
   * ```
   */
  public async sendTransaction({ signer, txnData }: { chainId: number; signer: Signer | WalletClient; txnData: ExecuteTxnData }) {
    return await GenericTxnHandler.sendTransaction({
      signer,
      ...txnData,
    });
  }

  /**
   * Waits for a batch transaction to be mined and returns the transaction receipt.
   *
   * @param params - Configuration object for transaction sending
   * @param params.walletClient - The wallet client
   * @param params.batchHash - The hash of the batch transaction
   * @returns Promise resolving to the transaction execution result
   *
   * @example
   * ```typescript
   * const result = await client.waitForBatchTransactionReceipt({
   *   walletClient: walletClient,
   *   batchHash: '0x...',
   * });
   * ```
   */
  public async waitForBatchTransactionReceipt({ walletClient, batchHash }: { walletClient: WalletClient; batchHash: HexString }) {
    return await waitForBatchTransactionReceipt(walletClient, batchHash);
  }

  /**
   * Decodes and interprets transaction receipt data for DZap protocol operations.
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
   * const decodedData = await client.decodeTxnData({
   *   data: transactionReceipt,
   *   service: 'swap',
   *   chainId: 1
   * });
   *
   * console.log('Decoded transaction:', decodedData);
   * ```
   */
  public async decodeTxnData({ data, service, chainId }: { data: TransactionReceipt; service: AvailableDZapServices; chainId: number }) {
    const chainConfig = await DZapClient.getChainConfig();
    if (chainConfig === null || chainConfig?.[chainId] == null) {
      throw new Error('Chains config not found');
    }
    return handleDecodeTxnData(data, service, chainConfig[chainId]);
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
   * const pointsResult = await client.calculatePoints({
   *   userAddress: '0x...',
   *   transactionHash: '0x...',
   *   chainId: 1,
   *   // ... other required parameters
   * });
   *
   * console.log('Earned points:', pointsResult.points);
   * ```
   */
  public async calculatePoints(request: CalculatePointsRequest): Promise<{ points: number }> {
    return await fetchCalculatedPoints(request);
  }

  /**
   * Retrieves the deployed contract address for a specific DZap service on a given blockchain.
   * Different services (swap, bridge, dca, zap) may use different contract addresses.
   * This method ensures you get the correct contract address for the intended operation.
   *
   * @param params - Configuration object for contract address lookup
   * @param params.chainId - The blockchain network ID to get the contract address for
   * @param params.service - The DZap service type to get the contract address for
   * @returns Promise resolving to the contract address string
   *
   * @example
   * ```typescript
   * const swapContract = await client.getDZapContractAddress({
   *   chainId: 1,
   *   service: 'swap'
   * });
   *
   * const zapContract = await client.getDZapContractAddress({
   *   chainId: 42161,
   *   service: 'zap'
   * });
   * ```
   */
  public async getDZapContractAddress({ chainId, service }: { chainId: number; service: AvailableDZapServices }): Promise<string> {
    const chainConfig = await DZapClient.getChainConfig();
    if (!chainConfig[chainId].isEnabled || !chainConfig) {
      throw new Error('Chains config not found');
    }

    const chainData = chainConfig[chainId];
    if (!chainData?.contracts) {
      throw new Error(`No contracts found for chain: ${chainId}`);
    }
    const contractMap: Record<AvailableDZapServices, string | undefined> = {
      [Services.trade]: chainData.contracts.router,
      [Services.dca]: chainData.contracts.dca,
      [Services.zap]: chainData.contracts.zap,
    };

    const contractAddress = contractMap[service];

    if (!contractAddress) {
      throw new Error(`Contract not found for service "${service}" on chain: ${chainId}`);
    }

    return contractAddress;
  }

  /**
   * Checks current token allowances for a sender address across multiple tokens.
   * This method supports different approval modes (ERC20, Permit2, AutoPermit) and provides
   * detailed information about required approvals and signatures for trade execution.
   *
   * @param params - Configuration object for allowance checking
   * @param params.chainId - The blockchain network ID to check allowances on
   * @param params.sender - The wallet address to check allowances for
   * @param params.tokens - Array of token objects containing address and amount information
   * @param params.rpcUrls - Optional custom RPC URLs for blockchain interactions
   * @param params.service - The DZap service that will spend the tokens
   * @param params.mode - Optional approval mode (defaults to AutoPermit for optimal UX)
   * @param params.spender - Optional custom spender address (if not using default DZap contract)
   * @returns Promise resolving to allowance information including current allowances and required actions
   *
   * @example
   * ```typescript
   * const allowanceInfo = await client.getAllowance({
   *   chainId: 1,
   *   sender: '0x...',
   *   tokens: [
   *     { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: '1000000' }
   *   ],
   *   service: 'swap',
   *   mode: ApprovalModes.Permit2
   * });
   *
   * console.log('Approvals needed:', allowanceInfo.data.noOfApprovalsRequired);
   * ```
   */
  public async getAllowance({
    chainId,
    sender,
    tokens,
    service,
    rpcUrls,
    spender,
    mode = ApprovalModes.AutoPermit,
  }: {
    chainId: number;
    sender: HexString;
    tokens: { address: HexString; amount: string }[];
    service: AvailableDZapServices;
    rpcUrls?: string[];
    spender?: HexString; // Optional custom spender address
    mode?: ApprovalMode;
  }) {
    const chainConfig = await DZapClient.getChainConfig();
    const spenderAddress = spender || ((await this.getDZapContractAddress({ chainId, service })) as HexString);
    return await getAllowance({
      chainId,
      sender,
      tokens,
      rpcUrls: rpcUrls || this.rpcUrlsByChainId[chainId],
      mode,
      spender: spenderAddress,
      permitEIP2612DisabledTokens: chainConfig[chainId].permitDisabledTokens?.eip2612,
    });
  }

  /**
   * Approves tokens for spending by DZap contracts with support for multiple approval modes.
   * This method automatically determines the appropriate spender address based on the approval mode (if not specified)
   * and handles transaction submission with optional callback for status updates.
   *
   * @param params - Configuration object for token approval
   * @param params.chainId - The blockchain network ID to execute approvals on
   * @param params.signer - The wallet signer to sign approval transactions
   * @param params.sender - The wallet address that owns the tokens
   * @param params.rpcUrls - Optional custom RPC URLs for blockchain interactions
   * @param params.tokens - Array of token objects containing address and amount to approve
   * @param params.approvalTxnCallback - Optional callback function for approval transaction status updates
   * @param params.mode - Optional approval mode (defaults to AutoPermit for optimal UX)
   * @param params.spender - Optional custom spender address (if not using default DZap contract)
   * @param params.service - The DZap service that will spend the approved tokens
   * @returns Promise resolving to approval transaction results
   *
   * @example
   * ```typescript
   * const approvalResult = await client.approve({
   *   chainId: 1,
   *   signer: walletClient,
   *   sender: '0x...',
   *   tokens: [
   *     { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: '1000000' }
   *   ],
   *   service: 'swap',
   *   mode: ApprovalModes.Permit2,
   *   approvalTxnCallback: async ({ txnDetails, address }) => {
   *     console.log(`Approval for ${address}:`, txnDetails);
   *   }
   * });
   * ```
   */
  public async approve({
    chainId,
    signer,
    tokens,
    approvalTxnCallback,
    service,
    mode = ApprovalModes.AutoPermit,
    rpcUrls,
    spender,
  }: {
    chainId: number;
    signer: WalletClient | Signer;
    tokens: { address: HexString; amount: string }[];
    approvalTxnCallback?: ({
      txnDetails,
      address,
    }: {
      txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
      address: HexString;
    }) => Promise<TxnStatus | void>;
    service: AvailableDZapServices;
    spender?: HexString; // Optional custom spender address
    rpcUrls?: string[];
    mode?: ApprovalMode;
  }) {
    const spenderAddress = spender || ((await this.getDZapContractAddress({ chainId, service })) as HexString);
    return await approveToken({
      chainId,
      signer,
      rpcUrls: rpcUrls || this.rpcUrlsByChainId[chainId],
      tokens,
      approvalTxnCallback,
      mode,
      spender: spenderAddress,
    });
  }

  /**
   * Signs permit data for gas-less token approvals using EIP-2612 or Permit2 standards.
   * This method enables users to authorize token spending without paying gas fees for approval transactions.
   * The signed permits can then be used in subsequent trade transactions.
   *
   * @param params - Configuration object for permit signing
   * @param params.chainId - The blockchain network ID where tokens exist
   * @param params.sender - The wallet address that owns the tokens
   * @param params.tokens - Array of token objects containing address and amount information
   * @param params.service - The DZap service that will use the permit
   * @param params.rpcUrls - Optional custom RPC URLs for blockchain interactions
   * @param params.signer - The wallet signer to sign permit messages
   * @param params.permitType - Optional permit type (defaults to AutoPermit for optimal compatibility)
   * @param params.signatureCallback - Optional callback function for each completed signature
   * @param params.spender - Optional custom spender address (if not using default DZap contract)
   * @returns Promise resolving to permit signatures and related data
   *
   * @example
   * ```typescript
   * const permitResult = await client.sign({
   *   chainId: 1,
   *   sender: '0x...',
   *   tokens: [
   *     { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', amount: '1000000' }
   *   ],
   *   service: 'swap',
   *   signer: walletClient,
   *   permitType: PermitTypes.Permit2,
   *   signatureCallback: async ({ permitData, srcToken }) => {
   *     console.log(`Signed permit for ${srcToken}:`, permitData);
   *   }
   * });
   * ```
   */
  public async sign({
    chainId,
    sender,
    tokens,
    service,
    spender,
    rpcUrls,
    signer,
    permitType = PermitTypes.AutoPermit,
    signatureCallback,
  }: {
    chainId: number;
    sender: HexString;
    tokens: {
      address: HexString;
      amount: string;
    }[];
    service: AvailableDZapServices;
    signer: WalletClient | Signer;
    spender?: HexString; // Optional custom spender address
    rpcUrls?: string[];
    permitType?: PermitMode;
    signatureCallback?: ({
      permitData,
      srcToken,
      amount,
      permitType,
    }: {
      permitData: HexString;
      srcToken: string;
      amount: string;
      permitType: PermitMode;
    }) => Promise<void>;
  }) {
    const spenderAddress = spender || ((await this.getDZapContractAddress({ chainId, service })) as HexString);
    const chainConfig = await DZapClient.getChainConfig();
    return await PermitTxnHandler.signPermit({
      chainId,
      sender,
      tokens,
      rpcUrls: rpcUrls || this.rpcUrlsByChainId[chainId],
      service,
      signer,
      spender: spenderAddress,
      permitType,
      signatureCallback,
      permitEIP2612DisabledTokens: chainConfig[chainId].permitDisabledTokens?.eip2612,
      contractVersion: chainConfig[chainId].version || ContractVersion.v2,
    });
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
   * const zapResult = await client.zap({
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
   * const zapResult2 = await client.zap({
   *   request: zapRequest,
   *   steps: zapBuild.steps,
   *   signer: walletClient
   * });
   * ```
   */
  public async zap({ request, steps, signer }: { request: ZapBuildTxnRequest; signer: WalletClient | Signer; steps?: ZapTransactionStep[] }) {
    return await ZapTxnHandler.zap({
      request,
      steps,
      signer,
    });
  }

  /**
   * Builds comprehensive transaction data for zap operations without executing them.
   * This method prepares all necessary steps, routing information, and transaction parameters
   * for complex multi-protocol interactions. The resulting data can be used with the zap method.
   *
   * @param request - The zap build request containing operation parameters and preferences
   * @returns Promise resolving to complete zap transaction data with execution steps
   *
   * @example
   * ```typescript
   * const zapTxData = await client.buildZapTxn({
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
  public async buildZapTxn(request: ZapBuildTxnRequest): Promise<ZapBuildTxnResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapBuildTxnResponse = (await fetchZapBuildTxnData(request, this.cancelTokenSource.token)).data;
    return route;
  }

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
   * const zapQuote = await client.getZapQuote({
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
  public async getZapQuote(request: ZapQuoteRequest): Promise<ZapQuoteResponse> {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Cancelled due to new request');
    }
    this.cancelTokenSource = Axios.CancelToken.source();
    const route: ZapQuoteResponse = (await fetchZapQuote(request, this.cancelTokenSource.token)).data;
    return route;
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
   * const zapStatus = await client.getZapTxnStatus({
   *   chainId: '1',
   *   txnHash: '0x...'
   * });
   *
   * console.log('Zap status:', zapStatus.status);
   * console.log('Completed steps:', zapStatus.completedSteps);
   * console.log('Current step:', zapStatus.currentStep);
   * ```
   */
  public async getZapTxnStatus(request: ZapStatusRequest): Promise<ZapStatusResponse> {
    const status: ZapStatusResponse = (await fetchZapTxnStatus(request)).data;
    return status;
  }

  /**
   * Fetches all token balances for a specific account on a given blockchain network.
   * This method retrieves the complete portfolio of tokens held by the specified wallet address,
   * including token metadata and current balance amounts for each token.
   *
   * @param chainId - The blockchain network ID to fetch balances from (e.g., 1 for Ethereum, 42161 for Arbitrum)
   * @param account - The wallet address to fetch token balances for
   * @returns Promise resolving to an object where each key is a token contract address and each value contains token balance and metadata (e.g., name, symbol, decimals).
   *
   * @example
   * ```typescript
   * // Get all token balances for a wallet on Base
   * const balances = await client.getBalances(8453, '0x...');
   *
   * // Process the balances
   * Object.entries(balances).forEach(([contractAddress, token]) => {
   *   console.log(`${token.symbol}: ${token.balance}`);
   *   console.log(`Contract: ${contractAddress}`);
   * });
   *
   * // Get specific token balance
   * const usdcBalance = balances['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'];
   * console.log(`USDC Balance: ${usdcBalance.balance}`);
   * ```
   */
  public async getBalances(chainId: number, account: string): Promise<Record<string, TokenResponse>> {
    const balanceData = await fetchBalances(chainId, account);
    return balanceData.result;
  }

  /**
   * Send batch calls
   * @param params
   * @param params.walletClient - The wallet client
   * @param params.calls - The calls to send
   * @returns Promise resolving to batch call result
   *
   * @example
   * ```typescript
   * const calls  = [{
   *   to: '0x...',
   *   data: '0x...',
   *   value: 0n,
   * }]
   * const result = await client.sendBatchCalls({
   *   walletClient: walletClient,
   *   calls,
   * });
   * ```
   */
  public async sendBatchCalls({ walletClient, calls }: { walletClient: WalletClient; calls: BatchCallParams[] }) {
    return await sendBatchCalls(walletClient, calls);
  }
}

export default DZapClient;
