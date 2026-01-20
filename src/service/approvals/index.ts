import type { Signer } from 'ethers';
import type { Address, MulticallParameters, Prettify, WalletClient } from 'viem';
import { encodeFunctionData, maxUint256 } from 'viem';

import { erc20Abi } from '../../artifacts';
import { config } from '../../config';
import { ApprovalModes } from '../../constants/approval';
import { ERC20_FUNCTIONS } from '../../constants/erc20';
import { PermitTypes } from '../../constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../../enums';
import type {
  ApprovalMode,
  AvailableDZapServices,
  ChainData,
  GasSignatureParams,
  HexString,
  PermitMode,
  SignPermitResponse,
  TokenPermitData,
} from '../../types';
import { isDZapNativeToken } from '../../utils/address';
import { checkEIP2612PermitSupport } from '../../utils/eip2612Permit';
import { logger } from '../../utils/logger';
import { multicall } from '../../utils/multicall';
import { isEthersSigner } from '../../utils/signer';
import { ChainsService } from '../chains';
import type { ContractsService } from '../contracts';
import { SignatureService } from '../signature';
import { Permit2 } from '../signature/permit2';
import { TransactionsService } from '../transactions';

/**
 * ApprovalsService handles all approval and permit operations for token spending.
 */
export class ApprovalsService {
  constructor(
    private chainsService: ChainsService,
    private contractsService: ContractsService,
  ) {}

  /**
   * Gets approval context (chain config and spender address) in a single batch call
   * This optimizes the common pattern of fetching both chainConfig and contract address
   * @param params - Parameters for getting approval context
   * @returns Promise resolving to approval context with chainConfig and spenderAddress
   */
  private async getApprovalContext({ chainId, service, spender }: { chainId: number; service: AvailableDZapServices; spender?: HexString }): Promise<{
    chainConfig: ChainData;
    spenderAddress: HexString;
    multicallAddress?: HexString;
  }> {
    // Batch fetch chain config and contract address in parallel
    const [chainConfig, contractAddress] = await Promise.all([
      this.chainsService.getConfig(),
      spender ? Promise.resolve(spender) : this.contractsService.getAddress({ chainId, service }),
    ]);

    return {
      chainConfig,
      spenderAddress: contractAddress as HexString,
      multicallAddress: chainConfig?.[chainId]?.multicallAddress,
    };
  }

  /**
   * Checks current token allowances for a sender address across multiple tokens
   * @param params - Configuration object for allowance checking
   * @returns Promise resolving to allowance information including current allowances and required actions
   */
  private async getAllowanceData(params: {
    chainId: number;
    sender: HexString;
    tokens: { address: HexString; amount: string; permit?: TokenPermitData }[];
    spender: HexString;
    rpcUrls?: string[];
    mode?: ApprovalMode;
    multicallAddress?: HexString;
  }): Promise<{
    status: TxnStatus;
    code: StatusCodes;
    data: { [key: string]: { allowance: bigint; approvalNeeded: boolean; signatureNeeded: boolean } };
  }> {
    const { chainId, sender, tokens, rpcUrls, multicallAddress, mode, spender } = params;
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
            permit,
          });
          return {
            token: address,
            spender: eip2612PermitData.supportsPermit ? spender : Permit2.getAddress(chainId),
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
          const permit2Address = Permit2.getAddress(chainId);
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
      const { data: allowances } = await this.batchGetAllowances({
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
    } catch (error: unknown) {
      logger.error('Multicall allowance check failed', {
        service: 'ApprovalsService',
        method: 'getAllowanceData',
        chainId,
        tokensCount: erc20Tokens.length,
        error,
      });
      return { status: TxnStatus.error, code: StatusCodes.Error, data };
    }
  }

  /**
   * Batch ERC20 allowance checks using multicall
   * @param params - Parameters for batch allowance check
   * @returns Promise resolving to allowance data for each token
   */
  private async batchGetAllowances({
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
      logger.error('Batch allowance check failed', {
        service: 'ApprovalsService',
        method: 'batchGetAllowances',
        chainId,
        tokensCount: data.length,
        status,
        code,
      });
      return { status, code, data: {} };
    }

    const tokenAllowances: Record<string, bigint> = {};
    for (let i = 0; i < data.length; i++) {
      tokenAllowances[data[i].token] = allowances[i] as bigint;
    }

    return { status, code, data: tokenAllowances };
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
   * const allowanceInfo = await client.approvals.getAllowance({
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
    tokens: { address: HexString; amount: string; permit?: TokenPermitData }[];
    service: AvailableDZapServices;
    rpcUrls?: string[];
    spender?: HexString;
    mode?: ApprovalMode;
  }) {
    const { spenderAddress, multicallAddress } = await this.getApprovalContext({
      chainId,
      service,
      spender,
    });
    return await this.getAllowanceData({
      chainId,
      sender,
      tokens,
      rpcUrls: rpcUrls || config.getRpcUrlsByChainId(chainId),
      mode,
      spender: spenderAddress,
      multicallAddress,
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
   * @param params.batchTransaction - Optional flag to use batch transaction (EIP-5792) for multiple approvals
   * @returns Promise resolving to approval transaction results
   *
   * @example
   * ```typescript
   * const approvalResult = await client.approvals.approve({
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
    }) => Promise<TxnStatus | null>;
    service: AvailableDZapServices;
    spender?: HexString;
    rpcUrls?: string[];
    mode?: ApprovalMode;
  }) {
    const { spenderAddress } = await this.getApprovalContext({
      chainId,
      service,
      spender,
    });
    let finalSpender = spenderAddress;
    if (mode !== ApprovalModes.Default) {
      finalSpender = Permit2.getAddress(chainId);
    }
    for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
      let txnDetails = { status: TxnStatus.success, code: StatusCodes.Success, txnHash: '' };
      if (isEthersSigner(signer)) {
        const from = await signer.getAddress();
        const callData = encodeFunctionData({
          abi: erc20Abi,
          functionName: ERC20_FUNCTIONS.approve,
          args: [finalSpender, BigInt(tokens[dataIdx].amount)],
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
        const publicClient = ChainsService.getPublicClient(chainId, rpcUrls);
        try {
          const { request } = await publicClient.simulateContract({
            address: tokens[dataIdx].address,
            abi: erc20Abi,
            functionName: ERC20_FUNCTIONS.approve,
            args: [finalSpender, BigInt(tokens[dataIdx].amount)],
            account: signer.account,
          });
          const hash = await signer.writeContract(request);
          txnDetails = { txnHash: hash, status: TxnStatus.success, code: StatusCodes.Success };
        } catch (e: unknown) {
          const error = e as { code?: StatusCodes };
          logger.error('Token approval transaction failed', {
            service: 'ApprovalsService',
            method: 'approve',
            chainId,
            tokenAddress: tokens[dataIdx].address,
            error: e,
          });
          if (error?.code === StatusCodes.UserRejectedRequest) {
            txnDetails = { status: TxnStatus.rejected, code: error.code, txnHash: '' };
          } else {
            txnDetails = { status: TxnStatus.error, code: error?.code || StatusCodes.Error, txnHash: '' };
          }
        }
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
          logger.warn('Approval callback returned non-success status', {
            service: 'ApprovalsService',
            method: 'approve',
            tokenAddress: tokens[dataIdx].address,
            callbackStatus,
            chainId,
          });
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
   * const permitResult = await client.approvals.sign({
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
  public async sign(
    params: Prettify<
      Omit<GasSignatureParams, 'spender' | 'permitType' | 'rpcUrls' | 'gasless' | 'contractVersion'> & {
        spender?: HexString;
        permitType?: PermitMode;
        rpcUrls?: string[];
        service: AvailableDZapServices;
      }
    >,
  ): Promise<SignPermitResponse> {
    const { service, chainId } = params;
    const { spenderAddress, chainConfig } = await this.getApprovalContext({
      chainId,
      service,
      spender: params?.spender,
    });

    const permitType = params?.permitType || PermitTypes.AutoPermit;

    const request = {
      ...params,
      rpcUrls: params?.rpcUrls || config.getRpcUrlsByChainId(chainId),
      permitType,
      spender: spenderAddress,
      gasless: false,
      contractVersion: chainConfig[chainId]?.version || ContractVersion.v1,
    } as GasSignatureParams;
    return await SignatureService.signPermit(request);
  }

  /**
   * Generates approval batch call parameters for tokens that need approval
   * @param params - Parameters for generating batch approval calls
   * @returns Promise resolving to array of batch call parameters
   */
  public async generateApprovalBatchCalls({
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
    const { data: allowanceData } = await this.getAllowanceData({
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
      data: ApprovalsService.encodeApproveCallData({
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
  public async batchApproveTokens({
    walletClient,
    tokens,
    chainId,
    spender,
    sender,
    multicallAddress,
    rpcUrls,
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
  }): Promise<{ success: boolean; batchId?: string }> {
    const approveCalls = await this.generateApprovalBatchCalls({
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
    const batchResult = await TransactionsService.sendBatchCalls(walletClient, approveCalls);
    if (!batchResult) {
      logger.warn('Batch approval calls failed or not supported', {
        service: 'ApprovalsService',
        method: 'batchApproveTokens',
        chainId,
        tokensCount: approveCalls.length,
      });
    }
    return {
      success: Boolean(batchResult),
      batchId: batchResult?.id,
    };
  }

  /**
   * Encodes ERC20 approve function call data
   * @param spender - The address to approve
   * @param amount - The amount to approve
   * @returns Encoded function call data
   */
  private static encodeApproveCallData({ spender, amount }: { spender: Address; amount: bigint }): HexString {
    return encodeFunctionData({
      abi: erc20Abi,
      functionName: ERC20_FUNCTIONS.approve,
      args: [spender, amount],
    });
  }
}
