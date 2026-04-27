import type { Assign, Chain, ChainFormatters, Prettify } from 'viem';

export function extendViemChain<
  Formatters extends ChainFormatters,
  const Base extends Chain<ChainFormatters>,
  const Extension extends Partial<Chain<Formatters>>,
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
