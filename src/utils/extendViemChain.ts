import type { Assign, Chain, ChainFormatters, Prettify } from 'viem';

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
