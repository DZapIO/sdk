import type { Assign, Chain, ChainFormatters, Prettify } from 'viem';
import { ChainData } from '../types';

export function extendViemChain<
  Formatter extends ChainFormatters,
  const Base extends Chain<ChainFormatters>,
  const Extension extends Partial<Chain<Formatter>>,
>(base: Base, extension: Extension): Prettify<Assign<Chain<undefined>, Assign<Base, Extension>>> {
  const chain = {
    formatters: undefined,
    fees: undefined,
    serializers: undefined,
    ...base,
    ...extension,
  };
  return chain as Prettify<Assign<Chain<undefined>, Assign<Base, Extension>>>;
}

export function isNonEVMChain(chainId: number, chainConfig: ChainData) {
  return chainConfig[chainId]?.chainType !== 'evm';
}
