import type {
  ApiRpcResponse,
  Chain,
  Fee,
  FeeDetails,
  ProviderDetails,
  Token,
  TokenInfo,
  TokenResponse,
  TradeQuote,
  TradeQuotesResponse,
  TradeStatusResponse,
} from '../../../src/types';
import type {
  ZapApiResponse,
  ZapChains,
  ZapPool,
  ZapPoolDetails,
  ZapPoolsResponse,
  ZapPositionsResponse,
  ZapProviders,
  ZapUnderlyingToken,
} from '../../../src/types/zap';

type JsonPrimitive = string | number | boolean | null;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && !Number.isNaN(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isStringOrNumber = (value: unknown): value is string | number => isString(value) || isNumber(value);

const expectObject = (value: unknown, label: string): Record<string, unknown> => {
  if (!isObject(value)) {
    throw new Error(`${label}: expected object, got ${typeof value}`);
  }
  return value;
};

const expectField = (obj: Record<string, unknown>, key: string, predicate: (value: unknown) => boolean, label: string) => {
  if (!predicate(obj[key])) {
    throw new Error(`${label}.${key}: unexpected value ${JSON.stringify(obj[key])}`);
  }
};

const expectOptionalField = (
  obj: Record<string, unknown>,
  key: string,
  predicate: (value: unknown) => boolean,
  label: string,
) => {
  if (key in obj && obj[key] !== undefined && !predicate(obj[key])) {
    throw new Error(`${label}.${key}: unexpected value ${JSON.stringify(obj[key])}`);
  }
};

const expectProviderDetails = (value: unknown, label: string): ProviderDetails => {
  const obj = expectObject(value, label);
  expectField(obj, 'id', isString, label);
  expectField(obj, 'name', isString, label);
  expectField(obj, 'icon', isString, label);
  return value as ProviderDetails;
};

const expectFeeDetails = (value: unknown, label: string): FeeDetails => {
  const obj = expectObject(value, label);
  expectField(obj, 'address', isString, label);
  expectField(obj, 'decimals', isNumber, label);
  expectField(obj, 'chainId', isNumber, label);
  expectField(obj, 'symbol', isString, label);
  expectField(obj, 'amount', isString, label);
  expectField(obj, 'amountUSD', isString, label);
  expectField(obj, 'included', isBoolean, label);
  expectOptionalField(obj, 'logo', isString, label);
  expectOptionalField(obj, 'units', isString, label);
  return value as FeeDetails;
};

const expectFee = (value: unknown, label: string): Fee => {
  const obj = expectObject(value, label);
  for (const key of ['gasFee', 'providerFee', 'protocolFee'] as const) {
    if (!Array.isArray(obj[key])) {
      throw new Error(`${label}.${key}: expected array`);
    }
    (obj[key] as unknown[]).forEach((item, index) => expectFeeDetails(item, `${label}.${key}[${index}]`));
  }
  return value as Fee;
};

const expectToken = (value: unknown, label: string): Token => {
  const obj = expectObject(value, label);
  expectField(obj, 'address', isString, label);
  expectField(obj, 'decimals', isNumber, label);
  expectField(obj, 'chainId', isNumber, label);
  expectField(obj, 'logo', isString, label);
  expectField(obj, 'symbol', isString, label);
  expectOptionalField(obj, 'price', isString, label);
  return value as Token;
};

export const expectChain = (value: unknown, label = 'chain'): Chain => {
  const obj = expectObject(value, label);
  expectField(obj, 'chainId', isNumber, label);
  expectField(obj, 'chainType', isString, label);
  expectField(obj, 'name', isString, label);
  expectField(obj, 'isEnabled', isBoolean, label);
  expectOptionalField(obj, 'coinKey', isString, label);
  expectOptionalField(obj, 'coin', isString, label);
  expectOptionalField(obj, 'dcaContract', isString, label);
  expectOptionalField(obj, 'swapBridgeContract', isString, label);
  expectOptionalField(obj, 'logo', isString, label);
  expectOptionalField(obj, 'blockExplorerUrl', isString, label);
  expectOptionalField(obj, 'pricingAvailable', isBoolean, label);
  expectOptionalField(obj, 'balanceAvailable', isBoolean, label);
  expectOptionalField(obj, 'disableMultiTxn', isBoolean, label);
  expectOptionalField(obj, 'mainnet', isBoolean, label);

  if (obj.nativeToken !== undefined) {
    const nativeToken = expectObject(obj.nativeToken, `${label}.nativeToken`);
    expectField(nativeToken, 'contract', isString, `${label}.nativeToken`);
    expectField(nativeToken, 'symbol', isString, `${label}.nativeToken`);
    expectField(nativeToken, 'decimals', isNumber, `${label}.nativeToken`);
    expectField(nativeToken, 'name', isString, `${label}.nativeToken`);
    expectField(nativeToken, 'balance', isString, `${label}.nativeToken`);
    expectField(nativeToken, 'logo', isString, `${label}.nativeToken`);
    expectOptionalField(nativeToken, 'price', (v) => v === null || isString(v) || isNumber(v), `${label}.nativeToken`);
    expectOptionalField(nativeToken, 'chainId', isNumber, `${label}.nativeToken`);
    expectOptionalField(nativeToken, 'coinKey', isString, `${label}.nativeToken`);
    expectOptionalField(nativeToken, 'isErc20', isBoolean, `${label}.nativeToken`);
  }

  if (obj.rpcProviders !== undefined) {
    if (!Array.isArray(obj.rpcProviders)) {
      throw new Error(`${label}.rpcProviders: expected array`);
    }
    (obj.rpcProviders as unknown[]).forEach((provider, index) => {
      const rpc = expectObject(provider, `${label}.rpcProviders[${index}]`);
      expectField(rpc, 'url', isString, `${label}.rpcProviders[${index}]`);
      expectField(rpc, 'keyRequired', isBoolean, `${label}.rpcProviders[${index}]`);
      expectOptionalField(rpc, 'keyType', isString, `${label}.rpcProviders[${index}]`);
    });
  }

  if (obj.supportedAs !== undefined) {
    const supportedAs = expectObject(obj.supportedAs, `${label}.supportedAs`);
    expectField(supportedAs, 'source', isBoolean, `${label}.supportedAs`);
    expectField(supportedAs, 'destination', isBoolean, `${label}.supportedAs`);
  }

  return value as Chain;
};

export const expectSupportedChainsResponse = (value: unknown): Chain[] => {
  if (!Array.isArray(value)) {
    throw new Error('supported chains: expected array');
  }
  value.forEach((chain, index) => expectChain(chain, `chains[${index}]`));
  return value as Chain[];
};

export const expectTokenInfo = (value: unknown, label = 'token'): TokenInfo => {
  const obj = expectObject(value, label);
  expectField(obj, 'contract', isString, label);
  expectField(obj, 'symbol', isString, label);
  expectField(obj, 'decimals', isNumber, label);
  expectField(obj, 'name', isString, label);
  expectOptionalField(obj, 'balance', isString, label);
  expectOptionalField(obj, 'logo', isString, label);
  expectField(obj, 'chainId', isNumber, label);
  expectOptionalField(obj, 'price', (v) => v === null || isString(v) || isNumber(v), label);
  expectOptionalField(obj, 'balanceInUsd', (v) => v === null || isNumber(v), label);
  expectOptionalField(obj, 'coinKey', isString, label);
  expectOptionalField(obj, 'verified', isBoolean, label);
  expectOptionalField(obj, 'balanceSlot', isNumber, label);
  expectOptionalField(obj, 'allowanceSlot', isNumber, label);
  return value as TokenInfo;
};

export const expectTokenResponse = (value: unknown): TokenResponse => {
  const obj = expectObject(value, 'tokens');
  Object.entries(obj).forEach(([address, token]) => expectTokenInfo(token, `tokens[${address}]`));
  return value as TokenResponse;
};

export const expectTokenPriceResponse = (value: unknown): Record<string, string> => {
  const obj = expectObject(value, 'token prices');
  Object.entries(obj).forEach(([address, price]) => {
    if (!isString(price)) {
      throw new Error(`token prices[${address}]: expected string price`);
    }
  });
  return value as Record<string, string>;
};

export const expectTradeQuote = (value: unknown, label = 'quote'): TradeQuote => {
  const obj = expectObject(value, label);
  expectProviderDetails(obj.providerDetails, `${label}.providerDetails`);
  for (const key of ['srcAmount', 'srcAmountUSD', 'destAmount', 'destAmountUSD', 'minDestAmount', 'swapPerUnit', 'duration', 'priceImpactPercent'] as const) {
    expectField(obj, key, isString, label);
  }
  expectField(obj, 'gasless', isBoolean, label);
  expectToken(obj.srcToken, `${label}.srcToken`);
  expectToken(obj.destToken, `${label}.destToken`);
  expectFee(obj.fee, `${label}.fee`);

  if (!Array.isArray(obj.steps)) {
    throw new Error(`${label}.steps: expected array`);
  }
  (obj.steps as unknown[]).forEach((step, index) => {
    const stepObj = expectObject(step, `${label}.steps[${index}]`);
    expectField(stepObj, 'type', isString, `${label}.steps[${index}]`);
    const exchange = expectObject(stepObj.exchange, `${label}.steps[${index}].exchange`);
    expectField(exchange, 'name', isString, `${label}.steps[${index}].exchange`);
    expectOptionalField(exchange, 'logo', isString, `${label}.steps[${index}].exchange`);
    expectOptionalField(exchange, 'icon', isString, `${label}.steps[${index}].exchange`);
    expectOptionalField(exchange, 'id', isString, `${label}.steps[${index}].exchange`);
  });

  if (!Array.isArray(obj.path)) {
    throw new Error(`${label}.path: expected array`);
  }

  return value as TradeQuote;
};

export const expectTradeQuotesResponse = (value: unknown): TradeQuotesResponse => {
  const obj = expectObject(value, 'quotes');
  Object.entries(obj).forEach(([pair, entry]) => {
    const pairObj = expectObject(entry, `quotes[${pair}]`);
    expectField(pairObj, 'recommendedSource', isString, `quotes[${pair}]`);
    expectField(pairObj, 'bestReturnSource', isString, `quotes[${pair}]`);
    expectOptionalField(pairObj, 'fastestSource', isString, `quotes[${pair}]`);
    expectObject(pairObj.tokensWithoutPrice, `quotes[${pair}].tokensWithoutPrice`);

    if (pairObj.quoteRates !== undefined) {
      const rates = expectObject(pairObj.quoteRates, `quotes[${pair}].quoteRates`);
      Object.entries(rates).forEach(([provider, quote]) => expectTradeQuote(quote, `quotes[${pair}].quoteRates[${provider}]`));
    }
  });
  return value as TradeQuotesResponse;
};

export const expectTradeStatusResponse = (value: unknown, label = 'status'): TradeStatusResponse => {
  const obj = expectObject(value, label);
  expectField(obj, 'status', isString, label);
  expectField(obj, 'gasless', isBoolean, label);
  expectField(obj, 'txHash', isString, label);
  expectField(obj, 'chainId', isNumber, label);
  expectField(obj, 'timestamp', isNumber, label);
  expectField(obj, 'type', (v) => v === 'swap' || v === 'bridge' || v === 'zap', label);
  expectOptionalField(obj, 'private', isBoolean, label);

  if (!Array.isArray(obj.transactions)) {
    throw new Error(`${label}.transactions: expected array`);
  }

  return value as TradeStatusResponse;
};

export const expectBalancesResponse = (value: unknown): { result: TokenResponse } => {
  const obj = expectObject(value, 'balances');
  expectTokenResponse(obj.result);
  return value as { result: TokenResponse };
};

export const expectZapApiResponse = <T>(
  value: unknown,
  validateData: (data: unknown) => T,
  label = 'zap response',
): ZapApiResponse<T> => {
  const obj = expectObject(value, label);
  expectField(obj, 'status', (v) => v === 'success', label);
  return { status: 'success', data: validateData(obj.data) };
};

const expectZapUnderlyingToken = (value: unknown, label: string): ZapUnderlyingToken => {
  const obj = expectObject(value, label);
  expectField(obj, 'chainId', isNumber, label);
  expectField(obj, 'address', isString, label);
  expectField(obj, 'symbol', isString, label);
  expectField(obj, 'decimals', isNumber, label);
  expectOptionalField(obj, 'name', isString, label);
  expectOptionalField(obj, 'logo', (v) => v === null || isString(v), label);
  return value as ZapUnderlyingToken;
};

export const expectZapChains = (value: unknown): ZapChains => {
  const chains = expectObject(value, 'zap chains');
  Object.entries(chains).forEach(([chainId, config]) => {
    const chain = expectObject(config, `zap chains[${chainId}]`);
    expectField(chain, 'name', isString, `zap chains[${chainId}]`);
    if (!Array.isArray(chain.supportedProviders)) {
      throw new Error(`zap chains[${chainId}].supportedProviders: expected array`);
    }
    (chain.supportedProviders as unknown[]).forEach((provider) => {
      if (!isString(provider)) {
        throw new Error(`zap chains[${chainId}].supportedProviders: expected string entries`);
      }
    });
    expectOptionalField(chain, 'contracts', isObject, `zap chains[${chainId}]`);
  });
  return value as ZapChains;
};

export const expectZapProviders = (value: unknown): ZapProviders => {
  const providers = expectObject(value, 'zap providers');
  Object.entries(providers).forEach(([id, provider]) => {
    const providerObj = expectObject(provider, `zap providers[${id}]`);
    expectField(providerObj, 'id', isString, `zap providers[${id}]`);
    expectField(providerObj, 'name', isString, `zap providers[${id}]`);
    expectOptionalField(providerObj, 'icon', isString, `zap providers[${id}]`);
    expectOptionalField(providerObj, 'tags', (v) => Array.isArray(v), `zap providers[${id}]`);
    expectOptionalField(providerObj, 'description', isString, `zap providers[${id}]`);
    expectOptionalField(providerObj, 'websiteUrl', isString, `zap providers[${id}]`);
    expectOptionalField(providerObj, 'supportedActions', (v) => Array.isArray(v), `zap providers[${id}]`);
    expectOptionalField(providerObj, 'supportedChainIds', (v) => Array.isArray(v), `zap providers[${id}]`);
  });
  return value as ZapProviders;
};

export const expectZapPool = (value: unknown, label = 'pool'): ZapPool => {
  const obj = expectObject(value, label);
  expectField(obj, 'address', isString, label);
  expectField(obj, 'chainId', isNumber, label);
  expectField(obj, 'name', isString, label);
  expectField(obj, 'provider', isString, label);
  expectField(obj, 'apr', isNumber, label);
  expectField(obj, 'symbol', isString, label);
  expectField(obj, 'decimals', isNumber, label);
  expectOptionalField(obj, 'tvl', isStringOrNumber, label);
  expectOptionalField(obj, 'apy', isNumber, label);
  expectOptionalField(obj, 'metadata', (v): v is JsonPrimitive | Record<string, unknown> => v === null || isObject(v), label);

  if (!Array.isArray(obj.underlyingAssets)) {
    throw new Error(`${label}.underlyingAssets: expected array`);
  }
  (obj.underlyingAssets as unknown[]).forEach((asset, index) => expectZapUnderlyingToken(asset, `${label}.underlyingAssets[${index}]`));

  return value as ZapPool;
};

export const expectZapPoolsResponse = (value: unknown): ZapPoolsResponse => {
  const obj = expectObject(value, 'zap pools');
  if (!Array.isArray(obj.pools)) {
    throw new Error('zap pools.pools: expected array');
  }
  (obj.pools as unknown[]).forEach((pool, index) => expectZapPool(pool, `zap pools.pools[${index}]`));
  expectField(obj, 'pages', isNumber, 'zap pools');
  expectField(obj, 'limit', isNumber, 'zap pools');
  expectField(obj, 'offset', isNumber, 'zap pools');
  return value as ZapPoolsResponse;
};

export const expectZapPoolDetails = (value: unknown): ZapPoolDetails => {
  const obj = expectObject(value, 'zap pool details');
  expectField(obj, 'address', isString, 'zap pool details');
  expectField(obj, 'chainId', isNumber, 'zap pool details');
  expectField(obj, 'name', isString, 'zap pool details');
  expectField(obj, 'symbol', isString, 'zap pool details');
  expectField(obj, 'decimals', isNumber, 'zap pool details');
  expectOptionalField(obj, 'apr', isNumber, 'zap pool details');
  expectOptionalField(obj, 'apy', isNumber, 'zap pool details');
  expectOptionalField(obj, 'platformId', isString, 'zap pool details');
  expectOptionalField(obj, 'logo', isString, 'zap pool details');
  expectOptionalField(obj, 'metadata', (v): v is JsonPrimitive | Record<string, unknown> => v === null || isObject(v), 'zap pool details');

  if (obj.underlyingTokens !== undefined) {
    if (!Array.isArray(obj.underlyingTokens)) {
      throw new Error('zap pool details.underlyingTokens: expected array');
    }
    (obj.underlyingTokens as unknown[]).forEach((token, index) =>
      expectZapUnderlyingToken(token, `zap pool details.underlyingTokens[${index}]`),
    );
  }

  if (obj.slot0 !== undefined) {
    const slot0 = expectObject(obj.slot0, 'zap pool details.slot0');
    expectField(slot0, 'sqrtPriceX96', isString, 'zap pool details.slot0');
    expectField(slot0, 'tick', isNumber, 'zap pool details.slot0');
    expectField(slot0, 'tickSpacing', isNumber, 'zap pool details.slot0');
  }

  return value as ZapPoolDetails;
};

export const expectZapPositionsResponse = (value: unknown): ZapPositionsResponse => {
  const obj = expectObject(value, 'zap positions');
  if (!Array.isArray(obj.positions)) {
    throw new Error('zap positions.positions: expected array');
  }
  expectField(obj, 'count', isNumber, 'zap positions');
  return value as ZapPositionsResponse;
};
