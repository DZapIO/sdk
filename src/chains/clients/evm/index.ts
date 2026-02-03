import type { Signer } from 'ethers';
import type { Client, WalletClient } from 'viem';
import { createPublicClient, fallback, http, type PublicClient } from 'viem';
import { sendCalls, waitForCallsStatus } from 'viem/actions';
import { getAction } from 'viem/utils';

import { erc20Abi } from '../../../artifacts';
import { config } from '../../../config';
import { chainTypes, exclusiveChainIds } from '../../../constants/chains';
import { ERC20_FUNCTIONS } from '../../../constants/erc20';
import { RPC_BATCHING_WAIT_TIME, RPC_RETRY_DELAY } from '../../../constants/rpc';
import { DZAP_NATIVE_TOKEN_FORMAT, NATIVE_TOKENS } from '../../../constants/tokens';
import { StatusCodes, TxnStatus } from '../../../enums';
import type { DZapTransactionResponse, HexString } from '../../../types';
import type { EvmTxData } from '../../../types';
import type { WalletCallReceipt } from '../../../types/wallet';
import { parseError, TransactionError, ValidationError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { isEthersSigner } from '../../../utils/signer';
import { viemChainsById } from '../..';
import { BaseChainClient } from '../base';
import type { GetBalanceParams, PublicClientOptions, SendTransactionParams, TokenBalance, TransactionReceipt, WaitForReceiptParams } from '../types';

const publicClientRpcConfig = { batch: { wait: RPC_BATCHING_WAIT_TIME }, retryDelay: RPC_RETRY_DELAY };

/**
 * EVM chain implementation. Chain support is determined dynamically via viemChainsById (chainType === 'evm' in config).
 * getPublicClient returns viem PublicClient.
 */
export class EvmClient extends BaseChainClient {
  constructor() {
    super(chainTypes.evm, Object.keys(viemChainsById).map(Number));
  }

  isChainSupported(chainId: number): boolean {
    return viemChainsById[chainId] !== undefined;
  }

  getPublicClient(chainId: number, options?: PublicClientOptions): PublicClient {
    const chain = viemChainsById[chainId];
    if (!chain) {
      throw new ValidationError(`Unsupported chain ID: ${chainId}`);
    }
    const configuredRpcUrls = options?.rpcUrls ?? config.getRpcUrlsByChainId(chainId);
    const hasRpcUrls = configuredRpcUrls && Array.isArray(configuredRpcUrls) && configuredRpcUrls.length > 0;
    return createPublicClient({
      chain,
      transport: fallback(hasRpcUrls ? configuredRpcUrls.map((rpc: string) => http(rpc, publicClientRpcConfig)) : [http()]),
      batch: {
        multicall: {
          wait: RPC_BATCHING_WAIT_TIME,
        },
      },
    });
  }

  async sendTransaction(params: SendTransactionParams<Signer | WalletClient, EvmTxData>): Promise<DZapTransactionResponse> {
    const { chainId, signer, txnData } = params;

    if (!txnData) {
      return { code: StatusCodes.Error, status: TxnStatus.error, errorMsg: 'Invalid EVM transaction data' };
    }
    const evmTxData = txnData;

    try {
      if (isEthersSigner(signer)) {
        const fromAddress = evmTxData.from !== '0x' ? evmTxData.from : await signer.getAddress();
        const txnRes = await signer.sendTransaction({
          from: fromAddress,
          to: evmTxData.to,
          data: evmTxData.data,
          value: evmTxData.value,
          gasLimit: evmTxData.gasLimit,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash: txnRes.hash as HexString,
        };
      } else {
        const walletClient = signer as WalletClient;
        const fromAddress = (evmTxData.from !== '0x' ? evmTxData.from : walletClient.account?.address) as HexString;
        if (!fromAddress || fromAddress === '0x') {
          throw new ValidationError(
            'Cannot send transaction: no sender address. Ensure evmTxData.from is set or the WalletClient has a connected account.',
          );
        }
        const txnHash = await walletClient.sendTransaction({
          chain: viemChainsById[chainId],
          account: fromAddress,
          to: evmTxData.to as HexString,
          data: evmTxData.data as HexString,
          value: BigInt(evmTxData.value),
          gas: evmTxData.gasLimit ? BigInt(evmTxData.gasLimit) : undefined,
        });
        return {
          status: TxnStatus.success,
          code: StatusCodes.Success,
          txnHash,
        };
      }
    } catch (error: unknown) {
      logger.error('EVM transaction send failed', { service: 'EvmChain', method: 'sendTransaction', chainId, error });
      return {
        ...parseError(error),
        error,
      };
    }
  }

  /** Sends batch transactions via EIP-5792 (Viem sendCalls). */
  async sendBatchCalls(
    walletClient: WalletClient,
    calls: Array<{
      to: HexString;
      data: HexString;
      value?: bigint;
    }>,
  ): Promise<{ id: string } | null> {
    if (!walletClient.account) {
      throw new ValidationError(
        'Cannot send batch calls: WalletClient has no connected account. Ensure the wallet is connected before calling sendBatchCalls.',
      );
    }
    try {
      const result = await getAction(
        walletClient,
        sendCalls,
        'sendCalls',
      )({
        account: walletClient.account,
        calls: calls.map((call) => ({
          to: call.to,
          data: call.data,
          value: call.value ?? BigInt(0),
        })),
      });
      return result;
    } catch (error: unknown) {
      logger.warn('EIP-5792 batch calls not supported', { service: 'EvmChain', method: 'sendBatchCalls', error });
      return null;
    }
  }

  async waitForBatchTransactionReceipt(client: Client, batchHash: HexString): Promise<WalletCallReceipt> {
    const { receipts, status, statusCode } = await getAction(
      client,
      waitForCallsStatus,
      'waitForCallsStatus',
    )({
      id: batchHash,
      timeout: 3_600_000 * 24,
    });

    if (status === TxnStatus.success) {
      if (
        !receipts?.length ||
        !receipts.every((receipt) => receipt.transactionHash) ||
        receipts.some((receipt) => receipt.status === TxnStatus.reverted)
      ) {
        throw new TransactionError(StatusCodes.ContractExecutionError, 'Transaction was reverted.');
      }
      const transactionReceipt = receipts[receipts.length - 1]!;
      return transactionReceipt;
    }
    if (statusCode >= 400 && statusCode < 500) {
      throw new TransactionError(StatusCodes.UserRejectedRequest, 'Transaction was canceled.');
    }
    throw new TransactionError(StatusCodes.Error, 'Transaction failed.');
  }

  async getBalance(params: GetBalanceParams): Promise<TokenBalance[]> {
    const { chainId, account, tokenAddresses } = params;

    try {
      const publicClient = this.getPublicClient(chainId);

      const tokens = tokenAddresses && tokenAddresses.length > 0 ? tokenAddresses : [DZAP_NATIVE_TOKEN_FORMAT];
      const nativeTokensLower = new Set(NATIVE_TOKENS.map((t) => t.toLowerCase()));

      const isEvmNativeToken = (contract: string) =>
        contract.startsWith('0x') && contract.length === 42 && nativeTokensLower.has(contract.toLowerCase());

      let nativeBalance: bigint | null = null;
      if (tokens.some((t) => isEvmNativeToken(t))) {
        nativeBalance = await publicClient.getBalance({ address: account as HexString });
      }

      const erc20Tokens = tokens.filter((t) => !isEvmNativeToken(t));
      const erc20Contracts = erc20Tokens.map((token) => ({
        address: token as HexString,
        abi: erc20Abi,
        functionName: ERC20_FUNCTIONS.balanceOf,
        args: [account as HexString],
      }));

      const erc20BalancesByAddress = new Map<string, bigint>();
      if (erc20Contracts.length > 0) {
        const erc20Results = await publicClient.multicall({
          contracts: erc20Contracts,
          allowFailure: false,
        });
        for (let i = 0; i < erc20Tokens.length; i++) {
          erc20BalancesByAddress.set(erc20Tokens[i]!, erc20Results[i] ?? BigInt(0));
        }
      }

      return tokens.map((contract) => ({
        contract,
        balance: isEvmNativeToken(contract) ? (nativeBalance ?? BigInt(0)) : (erc20BalancesByAddress.get(contract) ?? BigInt(0)),
      }));
    } catch (error) {
      logger.error('Failed to fetch EVM balances', { service: 'EvmChain', method: 'getBalance', chainId, account, error });
      return [];
    }
  }

  async waitForTransactionReceipt(params: WaitForReceiptParams): Promise<TransactionReceipt> {
    const { chainId, txHash } = params;

    try {
      // HyperLiquid has non-standard receipt behavior in some integrations; treat as instant success.
      if (chainId === exclusiveChainIds.hyperLiquid) {
        return { status: TxnStatus.success, txHash };
      }

      const publicClient = this.getPublicClient(chainId);
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      return { status: TxnStatus.success, txHash };
    } catch (error) {
      logger.error('Failed to wait for EVM transaction receipt', {
        service: 'EvmChain',
        method: 'waitForTransactionReceipt',
        chainId,
        txHash,
        error,
      });
      return { status: TxnStatus.error, txHash, error };
    }
  }
}
