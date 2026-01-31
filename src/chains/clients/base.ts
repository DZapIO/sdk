import type { IChainClient } from './types';

/**
 * Base abstract class for ecosystem chain implementations
 * Provides common functionality and enforces interface contract
 */
export abstract class BaseChainClient implements IChainClient {
  protected chainType: string;
  protected supportedChainIds: number[];

  constructor(chainType: string, supportedChainIds: number[]) {
    this.chainType = chainType;
    this.supportedChainIds = supportedChainIds;
  }

  abstract getBalance(params: Parameters<IChainClient['getBalance']>[0]): ReturnType<IChainClient['getBalance']>;
  abstract sendTransaction(params: Parameters<IChainClient['sendTransaction']>[0]): ReturnType<IChainClient['sendTransaction']>;
  abstract waitForTransactionReceipt(
    params: Parameters<IChainClient['waitForTransactionReceipt']>[0],
  ): ReturnType<IChainClient['waitForTransactionReceipt']>;

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
