import { Signer } from 'ethers';
import { encodeFunctionData, formatUnits, maxUint256, MulticallParameters, WalletClient } from 'viem';
import { erc20Abi } from '../../artifacts';
import { fetchAllTokens, fetchTokenDetails } from '../../api';
import { ApprovalModes } from '../../constants/approval';
import { ERC20_FUNCTIONS } from '../../constants/erc20';
import { StatusCodes, TxnStatus } from '../../enums';
import { ApprovalMode, ChainData, HexString, TokenInfo, TokenPermitData, TokenResponse } from '../../types';
import { checkEIP2612PermitSupport } from '../../utils/eip-2612/eip2612Permit';
import { multicall } from '../../utils/multicall';
import { Permit2Service } from '../permit2';
import { isDZapNativeToken } from '../../utils/address';
import { isTypeSigner } from '../../utils/signer';
import { writeContract } from '../../utils/contract';
import { PriceService } from '../price';
import { priceProviders } from '../price/types/IPriceProvider';
import { encodeApproveCallData } from '../../utils/approval';

type AllowanceParams = {
  chainId: number;
  sender: HexString;
  tokens: { address: HexString; amount: string; permit?: TokenPermitData }[];
  spender: HexString;
  rpcUrls?: string[];
  mode?: ApprovalMode;
  multicallAddress?: HexString;
};

export class Token {
  /**
   * Fetches all available tokens for a specific blockchain with optional account-specific data.
   * Token data includes metadata, prices, and optionally user balances.
   * Prices are automatically updated using the integrated price service for accurate market data.
   *
   * @param chainId - The blockchain network ID to fetch tokens for
   * @param chainConfig - Chain configuration data
   * @param priceService - Price service instance for fetching token prices
   * @param source - Optional source identifier for filtered token lists
   * @param account - Optional wallet address to include balance information
   * @returns Promise resolving to token list with metadata and updated pricing information
   */
  public static async getAllTokens(
    chainId: number,
    chainConfig: ChainData | null,
    priceService: PriceService,
    source?: string,
    account?: string,
  ): Promise<TokenResponse> {
    try {
      const tokens = await fetchAllTokens(chainId, source, account);

      if (!chainConfig) return tokens;

      return await Token.updateTokenListPrices(tokens, chainId, chainConfig, priceService);
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
   */
  public static async getTokenDetails(
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
   */
  public static async getTokensDetails(
    tokenAddresses: string[],
    chainId: number,
    account?: string,
    includeBalance?: boolean,
    includePrice?: boolean,
  ): Promise<Record<string, TokenInfo> | TokenInfo> {
    return await fetchTokenDetails(tokenAddresses, chainId, account, includeBalance, includePrice);
  }

  /**
   * Sorts token entries by their USD balance value
   * @param tokenEntries - Array of token entries to sort
   * @returns Sorted token response object
   */
  private static sortByBalanceInUsd(tokenEntries: [string, TokenInfo][]): TokenResponse {
    const { withBalanceInUsd, withoutBalanceInUsd } = tokenEntries.reduce(
      (acc, [key, token]) => {
        if (token.balanceInUsd !== null) {
          acc.withBalanceInUsd.push([key, token]);
        } else {
          acc.withoutBalanceInUsd.push([key, token]);
        }
        return acc;
      },
      { withBalanceInUsd: [] as [string, TokenInfo][], withoutBalanceInUsd: [] as [string, TokenInfo][] },
    );

    withBalanceInUsd.sort((a, b) => b[1].balanceInUsd! - a[1].balanceInUsd!);

    return Object.fromEntries([...withBalanceInUsd, ...withoutBalanceInUsd]);
  }

  /**
   * Updates token list with current market prices
   * @param tokens - Token response object to update
   * @param chainId - Chain ID for the tokens
   * @param chainConfig - Chain configuration data
   * @param priceService - Price service instance for fetching token prices
   * @returns Promise resolving to updated token response with prices
   */
  private static async updateTokenListPrices(
    tokens: TokenResponse,
    chainId: number,
    chainConfig: ChainData,
    priceService: PriceService,
  ): Promise<TokenResponse> {
    try {
      const tokensWithoutPrice = Object.values(tokens)
        .filter(({ price, balance }) => (!price || price === '0') && balance !== '0')
        .map(({ contract }) => contract);

      if (tokensWithoutPrice.length === 0) return tokens;

      const fetchedPrices = await priceService.getPrices({
        chainId,
        tokenAddresses: tokensWithoutPrice,
        chainConfig,
        notAllowSources: [priceProviders.dZap],
      });

      tokensWithoutPrice.forEach((token) => {
        tokens[token].price = fetchedPrices[token] || tokens[token].price;
        tokens[token].balanceInUsd = fetchedPrices[token]
          ? parseFloat(fetchedPrices[token]) * parseFloat(formatUnits(BigInt(tokens[token].balance), tokens[token].decimals))
          : null;
      });
      return Token.sortByBalanceInUsd(Object.entries(tokens));
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return tokens;
    }
  }

  /**
   * Approves tokens for spending by a spender address
   * @param params - Approval parameters including signer, tokens, spender
   * @returns Promise resolving to transaction status
   */
  public static async approveToken({
    chainId,
    signer,
    rpcUrls,
    mode,
    tokens,
    approvalTxnCallback,
    spender,
  }: {
    chainId: number;
    signer: WalletClient | Signer;
    mode: ApprovalMode;
    tokens: { address: HexString; amount: string }[];
    rpcUrls?: string[];
    approvalTxnCallback?: ({
      txnDetails,
      address,
    }: {
      txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
      address: HexString;
    }) => Promise<TxnStatus | null>;
    spender: HexString;
  }): Promise<{ status: TxnStatus; code: StatusCodes }> {
    if (mode !== ApprovalModes.Default) {
      spender = Permit2Service.getContractAddress(chainId);
    }
    for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
      let txnDetails = { status: TxnStatus.success, code: StatusCodes.Success, txnHash: '' };
      if (isTypeSigner(signer)) {
        const from = await signer.getAddress();
        const callData = encodeFunctionData({
          abi: erc20Abi,
          functionName: ERC20_FUNCTIONS.approve,
          args: [spender, BigInt(tokens[dataIdx].amount)],
        });
        await signer.sendTransaction({
          from,
          chainId,
          to: tokens[dataIdx].address,
          data: callData,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
        };
      } else {
        txnDetails = await writeContract({
          chainId,
          contractAddress: tokens[dataIdx].address,
          abi: erc20Abi,
          functionName: ERC20_FUNCTIONS.approve,
          args: [spender, tokens[dataIdx].amount],
          rpcUrls,
          signer,
        });
      }
      if (txnDetails.code !== StatusCodes.Success) {
        return {
          status: txnDetails.status,
          code: txnDetails?.code || StatusCodes.FunctionNotFound,
        };
      }
      if (approvalTxnCallback) {
        const callbackStatus = await approvalTxnCallback({ txnDetails, address: tokens[dataIdx].address });
        if (callbackStatus && callbackStatus !== TxnStatus.success) {
          return {
            status: txnDetails.status,
            code: txnDetails?.code || StatusCodes.Error,
          };
        }
      }
    }
    return { status: TxnStatus.success, code: StatusCodes.Success };
  }

  /**
   * Batch ERC20 allowance checks using multicall
   * @param params - Parameters for batch allowance check
   * @returns Promise resolving to allowance data for each token
   */
  public static async batchGetAllowances({
    chainId,
    data,
    owner,
    multicallAddress,
    rpcUrls,
  }: {
    chainId: number;
    data: { token: HexString; spender: HexString }[];
    owner: HexString;
    multicallAddress?: HexString;
    rpcUrls?: string[];
  }): Promise<{ status: TxnStatus; code: StatusCodes; data: Record<string, bigint> }> {
    const contracts: MulticallParameters['contracts'] = data.map(({ token, spender }) => ({
      address: token,
      abi: erc20Abi,
      functionName: ERC20_FUNCTIONS.allowance,
      args: [owner, spender],
    }));

    const {
      status,
      code,
      data: allowances,
    } = await multicall({
      chainId,
      contracts,
      rpcUrls,
      multicallAddress,
      allowFailure: false,
    });

    if (status !== TxnStatus.success) {
      return { status, code, data: {} };
    }

    const tokenAllowances: Record<string, bigint> = {};
    for (let i = 0; i < data.length; i++) {
      tokenAllowances[data[i].token] = allowances[i] as bigint;
    }

    return { status, code, data: tokenAllowances };
  }

  /**
   * Get allowance information for tokens based on approval mode
   * @param params - Allowance parameters
   * @returns Promise resolving to allowance data for each token
   */
  public static async getAllowance({ chainId, sender, tokens, rpcUrls, multicallAddress, mode, spender }: AllowanceParams): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    data: { [key: string]: { allowance: bigint; approvalNeeded: boolean; signatureNeeded: boolean } };
  }> {
    const data: { [key: string]: { allowance: bigint; approvalNeeded: boolean; signatureNeeded: boolean } } = {};

    const nativeTokens = tokens.filter(({ address }) => isDZapNativeToken(address));
    const erc20Tokens = tokens.filter(({ address }) => !isDZapNativeToken(address));

    const approvalData = await Promise.all(
      erc20Tokens.map(async ({ address, amount, permit }) => {
        if (mode === ApprovalModes.AutoPermit) {
          const eip2612PermitData = await checkEIP2612PermitSupport({
            address,
            chainId,
            rpcUrls,
            owner: sender,
            permit,
          });
          return {
            token: address,
            spender: eip2612PermitData.supportsPermit ? spender : Permit2Service.getContractAddress(chainId), // @dev: not needed, but added for consistency
            amount,
            isEIP2612PermitSupported: eip2612PermitData.supportsPermit,
            isDefaultApprovalMode: false,
          };
        } else if (mode === ApprovalModes.Default) {
          return {
            token: address,
            spender,
            amount,
            isDefaultApprovalMode: true,
          };
        } else {
          const permit2Address = Permit2Service.getContractAddress(chainId);
          return { token: address, spender: permit2Address, amount, isDefaultApprovalMode: false };
        }
      }),
    );

    for (const { address } of nativeTokens) {
      data[address] = { allowance: maxUint256, approvalNeeded: false, signatureNeeded: false };
    }

    if (erc20Tokens.length === 0) {
      return { status: TxnStatus.success, code: StatusCodes.Success, data };
    }
    try {
      const { data: allowances } = await Token.batchGetAllowances({
        chainId,
        data: approvalData,
        owner: sender,
        multicallAddress,
        rpcUrls,
      });

      for (let i = 0; i < approvalData.length; i++) {
        const { token, amount, isEIP2612PermitSupported, isDefaultApprovalMode } = approvalData[i];
        const allowance = isEIP2612PermitSupported ? maxUint256 : allowances[token];
        const approvalNeeded = isEIP2612PermitSupported ? false : allowance < BigInt(amount);
        const signatureNeeded = isDefaultApprovalMode ? false : true;
        data[token] = { allowance, approvalNeeded, signatureNeeded };
      }

      return { status: TxnStatus.success, code: StatusCodes.Success, data };
    } catch (error: any) {
      console.error('Multicall allowance check failed:', error);
      return { status: TxnStatus.error, code: StatusCodes.Error, data };
    }
  }

  /**
   * Generates approval batch call parameters for tokens that need approval
   * @param params - Parameters for generating batch approval calls
   * @returns Promise resolving to array of batch call parameters
   */
  public static async generateApprovalBatchCalls({
    tokens,
    chainId,
    sender,
    spender,
    multicallAddress,
    rpcUrls,
  }: {
    tokens: Array<{
      address: HexString;
      amount: string;
    }>;
    chainId: number;
    sender: HexString;
    spender: HexString;
    multicallAddress?: HexString;
    rpcUrls?: string[];
  }): Promise<
    Array<{
      to: HexString;
      data: HexString;
      value: bigint;
    }>
  > {
    const tokensToCheck = tokens.filter((token) => !isDZapNativeToken(token.address));
    if (tokensToCheck.length === 0) {
      return [];
    }
    const { data: allowanceData } = await Token.getAllowance({
      chainId,
      sender,
      tokens: tokensToCheck,
      spender,
      multicallAddress,
      rpcUrls,
    });

    const tokensNeedingApproval = tokensToCheck.filter((token) => allowanceData[token.address]?.approvalNeeded);

    return tokensNeedingApproval.map((token) => ({
      to: token.address,
      data: encodeApproveCallData({
        spender,
        amount: BigInt(token.amount),
      }),
      value: BigInt(0),
    }));
  }

  /**
   * Batch approve multiple tokens using EIP-5792 if supported.
   * This is a convenience wrapper that generates approval batch calls and sends them.
   * @param params - Parameters for batch approval
   * @returns Promise resolving to success status and optional batch ID
   */
  public static async batchApproveTokens({
    walletClient,
    tokens,
    chainId,
    spender,
    sender,
    multicallAddress,
    rpcUrls,
    sendBatchCalls,
  }: {
    walletClient: WalletClient;
    tokens: Array<{
      address: HexString;
      amount: string;
    }>;
    chainId: number;
    spender: HexString;
    sender: HexString;
    multicallAddress?: HexString;
    rpcUrls?: string[];
    sendBatchCalls: (
      walletClient: WalletClient,
      calls: Array<{
        to: HexString;
        data: HexString;
        value?: bigint;
      }>,
    ) => Promise<{ id: string } | null>;
  }): Promise<{ success: boolean; batchId?: string }> {
    const approveCalls = await Token.generateApprovalBatchCalls({
      tokens,
      chainId,
      sender,
      multicallAddress,
      spender,
      rpcUrls,
    });
    if (approveCalls.length === 0) {
      return { success: true };
    }
    const batchResult = await sendBatchCalls(walletClient, approveCalls);
    return {
      success: Boolean(batchResult),
      batchId: batchResult?.id,
    };
  }
}
