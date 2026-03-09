import type { ChainPublicClient, DZapSigner, DZapTxnData, IChainClient } from './types';

/**
 * Base abstract class for ecosystem chain implementations.
 * TPublicClient: public client type (PublicClient | Connection | SuiClient | Client).
 * TSigner: signer type for sendTransaction (Signer | WalletClient | SolanaSigner | SuiWallet | BitcoinSigner).
 * TTxnData: txnData type for sendTransaction (chain-specific build response / tx data).
 */
export abstract class BaseChainClient<
  TPublicClient extends ChainPublicClient = ChainPublicClient,
  TSigner extends DZapSigner = DZapSigner,
  TTxnData extends DZapTxnData = DZapTxnData,
> implements IChainClient<TPublicClient, TSigner, TTxnData>
{
  protected chainType: string;
  protected supportedChainIds: number[];

  constructor(chainType: string, supportedChainIds: number[]) {
    this.chainType = chainType;
    this.supportedChainIds = supportedChainIds;
  }

  abstract getBalance(params: Parameters<IChainClient['getBalance']>[0]): ReturnType<IChainClient['getBalance']>;
  abstract sendTransaction(
    params: Parameters<IChainClient<TPublicClient, TSigner, TTxnData>['sendTransaction']>[0],
  ): ReturnType<IChainClient['sendTransaction']>;
  abstract waitForTransactionReceipt(
    params: Parameters<IChainClient['waitForTransactionReceipt']>[0],
  ): ReturnType<IChainClient['waitForTransactionReceipt']>;
  abstract getPublicClient(chainId: number, options?: Parameters<IChainClient<TPublicClient>['getPublicClient']>[1]): TPublicClient;

  getChainType(): string {
    return this.chainType;
  }

  getSupportedChainIds(): number[] {
    return this.supportedChainIds;
  }

  /**
   * Validates if a chain ID is supported by this ecosystem
   */
  isChainSupported(chainId: number): boolean {
    return this.supportedChainIds.includes(chainId);
  }
}
