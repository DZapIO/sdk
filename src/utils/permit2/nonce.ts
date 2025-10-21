import { permit2Abi } from '../../artifacts';
import { HexString } from '../../types';
import { Address, getContract, maxUint256, PublicClient } from 'viem';
import { getPublicClient } from '..';

export class NonceManager {
  private static readonly POSITION_BITS = BigInt(8);
  private static readonly MAX_POSITION = 256;
  private static readonly POSITION_MASK = BigInt(0xff);
  private static readonly MAX_WORD_ITERATIONS = 1000;
  private readonly permit2Contract;

  constructor(publicClient: PublicClient, permit2Address: HexString) {
    this.permit2Contract = getContract({
      address: permit2Address,
      abi: permit2Abi,
      client: publicClient,
    });
  }

  async nextNonce(owner: Address): Promise<bigint> {
    let word = BigInt(0);
    let pos = 0;

    for (let iteration = 0; iteration < NonceManager.MAX_WORD_ITERATIONS; iteration++) {
      const bitmap = await this.permit2Contract.read.nonceBitmap([owner, word]);

      if (bitmap === maxUint256) {
        ++word;
        pos = 0;
        continue;
      }

      let workingBitmap = bitmap;

      if (pos !== 0) {
        workingBitmap = workingBitmap >> BigInt(pos);
      }

      while (pos < NonceManager.MAX_POSITION && (workingBitmap & BigInt(1)) === BigInt(1)) {
        workingBitmap = workingBitmap >> BigInt(1);
        ++pos;
      }

      return this.nonceFromWordAndPos(word, pos);
    }
    throw new Error('Max iterations reached');
  }

  private nonceFromWordAndPos(word: bigint, pos: number): bigint {
    const nonce = word << NonceManager.POSITION_BITS;
    return nonce | BigInt(pos);
  }

  async getNonceBitmap(owner: Address, word: bigint): Promise<bigint> {
    return this.permit2Contract.read.nonceBitmap([owner, word]);
  }

  async isNonceUsed(owner: Address, nonce: bigint): Promise<boolean> {
    const word = nonce >> NonceManager.POSITION_BITS;
    const pos = Number(nonce & NonceManager.POSITION_MASK);
    const bitmap = await this.getNonceBitmap(owner, word);
    return ((bitmap >> BigInt(pos)) & BigInt(1)) === BigInt(1);
  }
}

export const getNextPermit2Nonce = async (permitAddress: HexString, account: HexString, chainId: number, rpcUrls?: string[]): Promise<bigint> => {
  const publicClient = getPublicClient({ chainId, rpcUrls });
  const nonceManager = new NonceManager(publicClient, permitAddress);
  return nonceManager.nextNonce(account);
};
