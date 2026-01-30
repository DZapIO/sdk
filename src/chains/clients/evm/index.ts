import type { Client, WalletClient } from 'viem';
import { sendCalls, waitForCallsStatus } from 'viem/actions';
import { getAction } from 'viem/utils';

import { erc20Abi } from '../../../artifacts';
import { chainTypes, exclusiveChainIds } from '../../../constants/chains';
import { ERC20_FUNCTIONS } from '../../../constants/erc20';
import { DZAP_NATIVE_TOKEN_FORMAT, NATIVE_TOKENS } from '../../../constants/tokens';
import { StatusCodes, TxnStatus } from '../../../enums';
import { ChainsService } from '../../../service/chains';
import type { DZapTransactionResponse, HexString } from '../../../types';
import type { EvmTxData, TradeBuildTxnResponse } from '../../../types';
import type { WalletCallReceipt } from '../../../types/wallet';
import { isEthersSigner } from '../../../utils';
import { parseError, TransactionError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { multicall } from '../../../utils/multicall';
import { viemChainsById } from '../..';
import { BaseChainClient } from '../base';
import type { GetBalanceParams, SendTransactionParams, TokenBalance, TransactionReceipt, WaitForReceiptParams } from '../types';

/**
 * EVM chain implementation. Chain support is determined dynamically via viemChainsById (chainType === 'evm' in config).
 */
export class EvmChain extends BaseChainClient {
  constructor() {
    super(chainTypes.evm, []); // Empty array - we check dynamically via chain config
  }

  isChainSupported(chainId: number): boolean {
    return viemChainsById[chainId] !== undefined;
  }

  private isEvmTxData(txnData: unknown): txnData is EvmTxData {
    return (
      !!txnData &&
      typeof txnData === 'object' &&
      'from' in txnData &&
      'to' in txnData &&
      'data' in txnData &&
      'value' in txnData &&
      'gasLimit' in txnData
    );
  }

  private isTradeBuildTxnResponse(txnData: unknown): txnData is TradeBuildTxnResponse {
    return (
      !!txnData &&
      typeof txnData === 'object' &&
      'txId' in txnData &&
      'status' in txnData &&
      'quotes' in txnData &&
      'data' in txnData &&
      'from' in txnData
    );
  }

  private extractEvmTxData(txnData: TradeBuildTxnResponse): EvmTxData {
    return {
      from: txnData.from as HexString,
      to: (txnData.to || '0x') as HexString,
      data: txnData.data as HexString,
      value: txnData.value || '0',
      gasLimit: txnData.gasLimit || '0',
    };
  }

  private extractEvmTransactionData(txnData: SendTransactionParams['txnData']): EvmTxData | null {
    if (this.isEvmTxData(txnData)) {
      return txnData;
    }
    if (this.isTradeBuildTxnResponse(txnData)) {
      return this.extractEvmTxData(txnData);
    }
    return null;
  }

  async sendTransaction(params: SendTransactionParams): Promise<DZapTransactionResponse> {
    const { chainId, signer, txnData } = params;

    const evmTxData = this.extractEvmTransactionData(txnData);
    if (!evmTxData) {
      return { code: StatusCodes.Error, status: TxnStatus.error, errorMsg: 'Invalid EVM transaction data' };
    }

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
      const publicClient = ChainsService.getPublicClient(chainId);

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
        const erc20Results = await multicall({
          chainId,
          contracts: erc20Contracts,
        });

        for (let i = 0; i < erc20Tokens.length; i++) {
          const token = erc20Tokens[i]!;
          const res = erc20Results.data[i];
          if (erc20Results.status === TxnStatus.success && res) {
            erc20BalancesByAddress.set(token, res);
          } else {
            erc20BalancesByAddress.set(token, BigInt(0));
          }
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

      const publicClient = ChainsService.getPublicClient(chainId);
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
