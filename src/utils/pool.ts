import Decimal from 'decimal.js';
import { parseUnits } from 'viem';

/**
 * Token information type for pool calculations
 */
export type PoolTokenInfo = {
  contract: string;
  name: string;
  chainId: number;
  symbol: string;
  balance: string;
  logo: string;
  decimals: number;
  price: string | number | null;
};

/**
 * Utility class for Concentrated Liquidity (CL) pool calculations
 * Provides methods for tick calculations, price conversions, liquidity calculations, and APR/APY calculations
 */
export class CLPoolUtils {
  private static Q96 = Math.pow(2, 96);
  private static tickMultiplier = 1.0001;

  /**
   * Rounds a tick to the nearest valid tick based on tick spacing
   * @param tick - The tick to round
   * @param tickSpacing - The tick spacing for the pool
   * @returns The rounded tick value
   */
  public static roundTick = ({ tick, tickSpacing }: { tick: number; tickSpacing: number }) => {
    return Math.round(tick / tickSpacing) * tickSpacing;
  };

  /**
   * Calculates the tick from a given price
   * @param price - The price to convert to tick
   * @param decimal0 - Decimals of token0
   * @param tickSpacing - The tick spacing for the pool
   * @param decimal1 - Decimals of token1
   * @returns The calculated tick value
   */
  public static getTickFromPrice = ({
    price,
    decimal0,
    tickSpacing,
    decimal1,
  }: {
    price: number;
    tickSpacing: number;
    decimal0: number;
    decimal1: number;
  }) => {
    const calculatedTick = Math.floor(Math.log(price / (Math.pow(10, decimal0) / Math.pow(10, decimal1))) / Math.log(CLPoolUtils.tickMultiplier));
    return CLPoolUtils.roundTick({ tick: calculatedTick, tickSpacing });
  };

  /**
   * Calculates the price from a given tick
   * @param tick - The tick to convert to price
   * @param decimal0 - Decimals of token0
   * @param decimal1 - Decimals of token1
   * @returns The calculated price
   */
  public static getPriceFromTick = ({ tick, decimal0, decimal1 }: { tick: number; decimal0: number; decimal1: number }) => {
    return new Decimal(CLPoolUtils.tickMultiplier).pow(tick).mul(new Decimal(10).pow(decimal0)).div(new Decimal(10).pow(decimal1)).toNumber();
  };

  /**
   * Calculates the price from a sqrt price ratio (Q96 format)
   * @param sqrtPriceX96 - The sqrt price in Q96 format
   * @param decimal0 - Decimals of token0
   * @param decimal1 - Decimals of token1
   * @returns The calculated price
   */
  public static getPriceFromSqrtRatio = ({ sqrtPriceX96, decimal0, decimal1 }: { sqrtPriceX96: bigint; decimal0: number; decimal1: number }) => {
    return new Decimal(sqrtPriceX96.toString())
      .div(new Decimal(CLPoolUtils.Q96))
      .pow(2)
      .mul(new Decimal(10).pow(decimal0))
      .div(new Decimal(10).pow(decimal1))
      .toNumber();
  };

  /**
   * Calculates the sqrt price (Q96 format) from a tick
   * @param tick - The tick to convert
   * @returns The sqrt price as a string in Q96 format
   */
  public static getSqrtPriceX96FromTick = ({ tick }: { tick: number }) => {
    return new Decimal(CLPoolUtils.tickMultiplier)
      .pow(tick / 2)
      .mul(CLPoolUtils.Q96)
      .toFixed(0);
  };

  /**
   * Calculates token swap distribution for zapping into a pool
   * @param token0 - Token0 information
   * @param token1 - Token1 information
   * @param zapInToken - The token being zapped in
   * @param zapInAmount - The amount being zapped in
   * @param token1ToToken0 - The price ratio of token1 to token0
   * @returns Distribution amounts for both tokens
   */
  public static calculateTokenSwapDistribution = ({
    token0,
    token1,
    zapInToken,
    zapInAmount,
    token1ToToken0,
  }: {
    token0: {
      decimals: number;
      price: string | number;
    };
    zapInToken: {
      decimals: number;
      price: string | number;
    };
    token1: {
      decimals: number;
      price: string | number;
    };
    token1ToToken0: number | string;
    zapInAmount: string | number;
  }) => {
    const token1ToToken0USD = Number(token1ToToken0) * Number(token1.price);

    const totalUSD = Number(token0.price) + token1ToToken0USD;

    const token0Multiplier = Number(token0.price) / totalUSD;
    const token1Multiplier = Number(token1ToToken0USD) / totalUSD;

    const zapInAmountUSD = Number(zapInAmount) * Number(zapInToken.price);

    const swapAmountForToken0USD = Number(zapInAmountUSD) * token0Multiplier;
    const swapAmountForToken1USD = Number(zapInAmountUSD) * token1Multiplier;

    const swapAmountForToken0 = Number(swapAmountForToken0USD) / Number(token0.price) || 0;
    const swapAmountForToken1 = Number(swapAmountForToken1USD) / Number(token1.price) || 0;

    const swapAmountForToken0InWei = parseUnits(swapAmountForToken0.toFixed(token0.decimals), token0.decimals);
    const swapAmountForToken1InWei = parseUnits(swapAmountForToken1.toFixed(token1.decimals), token1.decimals);

    return {
      amount0InWei: swapAmountForToken0InWei.toString(),
      amount1InWei: swapAmountForToken1InWei.toString(),
      amount0: swapAmountForToken0.toString(),
      amount1: swapAmountForToken1.toString(),
    };
  };

  /**
   * Calculates the liquidity amount for token0
   * @param formattedToken0Amount - The formatted amount of token0
   * @param currentPrice - The current price
   * @param upperTick - The upper tick bound
   * @param decimal0 - Decimals of token0
   * @param decimal1 - Decimals of token1
   * @returns The calculated liquidity
   */
  public static getLiquidityOfToken0 = ({
    formattedToken0Amount,
    currentPrice,
    upperTick,
    decimal0,
    decimal1,
  }: {
    formattedToken0Amount: number;
    currentPrice: number;
    upperTick: number;
    decimal0: number;
    decimal1: number;
  }) => {
    const maxPrice = CLPoolUtils.getPriceFromTick({ tick: upperTick, decimal0, decimal1 });
    const sqrtCurrentPrice = Math.sqrt(currentPrice);
    const sqrtMaxPrice = Math.sqrt(maxPrice);
    return (formattedToken0Amount * sqrtCurrentPrice * sqrtMaxPrice) / (sqrtMaxPrice - sqrtCurrentPrice);
  };

  /**
   * Calculates the liquidity amount for token1
   * @param formattedToken1Amount - The formatted amount of token1
   * @param currentPrice - The current price
   * @param lowerTick - The lower tick bound
   * @param decimal0 - Decimals of token0
   * @param decimal1 - Decimals of token1
   * @returns The calculated liquidity
   */
  public static getLiquidityOfToken1 = ({
    formattedToken1Amount,
    currentPrice,
    lowerTick,
    decimal0,
    decimal1,
  }: {
    formattedToken1Amount: number;
    currentPrice: number;
    lowerTick: number;
    decimal0: number;
    decimal1: number;
  }) => {
    const minPrice = CLPoolUtils.getPriceFromTick({ tick: lowerTick, decimal0, decimal1 });
    const sqrtCurrentPrice = Math.sqrt(currentPrice);
    const sqrtMinPrice = Math.sqrt(minPrice);
    return formattedToken1Amount / (sqrtCurrentPrice - sqrtMinPrice);
  };

  /**
   * Calculates the amount of token1 needed for a given amount of token0
   * @param formattedToken0Amount - The formatted amount of token0
   * @param sqrtPriceX96 - The current sqrt price in Q96 format
   * @param lowerTick - The lower tick bound
   * @param upperTick - The upper tick bound
   * @param decimal0 - Decimals of token0
   * @param decimal1 - Decimals of token1
   * @returns The calculated token1 amount
   */
  public static getToken1Amount = ({
    formattedToken0Amount,
    sqrtPriceX96,
    lowerTick,
    upperTick,
    decimal0,
    decimal1,
  }: {
    formattedToken0Amount: number;
    sqrtPriceX96: bigint;
    lowerTick: number;
    upperTick: number;
    decimal0: number;
    decimal1: number;
  }) => {
    const currentPrice = CLPoolUtils.getPriceFromSqrtRatio({
      sqrtPriceX96,
      decimal0,
      decimal1,
    });
    const liquidityOfToken0 = CLPoolUtils.getLiquidityOfToken0({
      formattedToken0Amount,
      currentPrice,
      upperTick,
      decimal0,
      decimal1,
    });
    const minPrice = CLPoolUtils.getPriceFromTick({ tick: lowerTick, decimal0, decimal1 });
    const sqrtCurrentPrice = Math.sqrt(currentPrice);
    const sqrtMinPrice = Math.sqrt(minPrice);
    return liquidityOfToken0 * (sqrtCurrentPrice - sqrtMinPrice);
  };

  /**
   * Calculates the amount of token0 needed for a given amount of token1
   * @param formattedToken1Amount - The formatted amount of token1
   * @param sqrtPriceX96 - The current sqrt price in Q96 format
   * @param lowerTick - The lower tick bound
   * @param upperTick - The upper tick bound
   * @param decimal0 - Decimals of token0
   * @param decimal1 - Decimals of token1
   * @returns The calculated token0 amount
   */
  public static getToken0Amount = ({
    formattedToken1Amount,
    sqrtPriceX96,
    lowerTick,
    upperTick,
    decimal0,
    decimal1,
  }: {
    formattedToken1Amount: number;
    sqrtPriceX96: bigint;
    lowerTick: number;
    upperTick: number;
    decimal0: number;
    decimal1: number;
  }) => {
    const currentPrice = CLPoolUtils.getPriceFromSqrtRatio({
      sqrtPriceX96,
      decimal0,
      decimal1,
    });
    const liquidityOfToken1 = CLPoolUtils.getLiquidityOfToken1({
      formattedToken1Amount,
      currentPrice,
      lowerTick,
      decimal0,
      decimal1,
    });
    const maxPrice = CLPoolUtils.getPriceFromTick({ tick: upperTick, decimal0, decimal1 });
    const sqrtCurrentPrice = Math.sqrt(currentPrice);
    const sqrtMaxPrice = Math.sqrt(maxPrice);
    return liquidityOfToken1 * (1 / sqrtCurrentPrice - 1 / sqrtMaxPrice);
  };

  /**
   * Calculates the tick from a sqrt price (Q96 format)
   * @param sqrtPriceX96 - The sqrt price in Q96 format as a string
   * @returns The calculated tick
   */
  public static getTickAtSqrtPrice = ({ sqrtPriceX96 }: { sqrtPriceX96: string }) => {
    const sqrtPrice = new Decimal(sqrtPriceX96).div(CLPoolUtils.Q96);
    const price = sqrtPrice.pow(2);
    const tick = new Decimal(Math.log(price.toNumber())).div(Math.log(CLPoolUtils.tickMultiplier));
    return Math.floor(tick.toNumber());
  };

  /**
   * Calculates token amounts for a given liquidity and price range
   * @param liquidity - The liquidity amount as a string
   * @param sqrtPriceX96 - The current sqrt price in Q96 format as a string
   * @param lowerTick - The lower tick bound
   * @param upperTick - The upper tick bound
   * @returns The calculated token amounts in wei
   */
  public static getTokenAmountsForLiquidity = ({
    liquidity,
    sqrtPriceX96,
    lowerTick,
    upperTick,
  }: {
    liquidity: string;
    sqrtPriceX96: string;
    lowerTick: number;
    upperTick: number;
  }) => {
    const sqrtRatioA = new Decimal(Math.sqrt(Math.pow(CLPoolUtils.tickMultiplier, lowerTick)));
    const sqrtRatioB = new Decimal(Math.sqrt(Math.pow(CLPoolUtils.tickMultiplier, upperTick)));

    const sqrtPrice = new Decimal(sqrtPriceX96).div(CLPoolUtils.Q96);
    const currentTick = CLPoolUtils.getTickAtSqrtPrice({ sqrtPriceX96 });
    let amount0InWei = new Decimal(0);
    let amount1InWei = new Decimal(0);
    if (currentTick < lowerTick) {
      amount0InWei = new Decimal(liquidity).mul(sqrtRatioB.minus(sqrtRatioA).div(sqrtRatioA.mul(sqrtRatioB)));
    } else if (currentTick >= upperTick) {
      amount1InWei = new Decimal(liquidity).mul(sqrtRatioB.minus(sqrtRatioA));
    } else if (currentTick >= lowerTick && currentTick < upperTick) {
      amount0InWei = new Decimal(liquidity).mul(sqrtRatioB.minus(sqrtPrice).div(new Decimal(sqrtPrice).mul(sqrtRatioB)));
      amount1InWei = new Decimal(liquidity).mul(new Decimal(sqrtPrice).minus(sqrtRatioA));
    }

    return { amount0InWei: amount0InWei.toFixed(0), amount1InWei: amount1InWei.toFixed(0) };
  };

  /**
   * Calculates APR by price range
   * @param poolApr - The base APR of the pool
   * @param lowerTick - The lower tick bound
   * @param upperTick - The upper tick bound
   * @param tickSpacing - The tick spacing for the pool
   * @returns The calculated APR for the range
   */
  public static calculateAprByRange = ({
    poolApr,
    lowerTick,
    upperTick,
    tickSpacing,
  }: {
    poolApr: number;
    lowerTick: number;
    upperTick: number;
    tickSpacing: number;
  }) => {
    const bin = Math.abs((upperTick - lowerTick) / tickSpacing);
    return Number((poolApr / bin).toFixed(2));
  };

  /**
   * Calculates APR based on staked liquidity and emissions
   * @param stackedLiquidity - The staked liquidity amounts
   * @param emissions - The emissions per day
   * @param tokenDetails - Token information for token0, token1, and rewards token
   * @param tokenPrices - Prices for token0, token1, and rewards token
   * @returns The calculated APR as a string
   */
  public static calculateAPR = ({
    stackedLiquidity,
    emissions,
    tokenDetails,
    tokenPrices,
  }: {
    stackedLiquidity: {
      staked0: string;
      staked1: string;
    };
    emissions: string;
    tokenDetails: {
      token0: PoolTokenInfo;
      token1: PoolTokenInfo;
      rewardsToken: PoolTokenInfo;
    };
    tokenPrices: {
      token0: string;
      token1: string;
      rewardsToken: string;
    };
  }) => {
    const formattedStakedLiq0 = new Decimal(stackedLiquidity.staked0).div(10 ** tokenDetails.token0.decimals);
    const formattedStakedLiq1 = new Decimal(stackedLiquidity.staked1).div(10 ** tokenDetails.token1.decimals);
    const formattedEmissions = new Decimal(emissions).mul(86400).div(10 ** tokenDetails.rewardsToken.decimals);

    const formattedStacked0USD = formattedStakedLiq0.mul(tokenPrices.token0);
    const formattedStacked1USD = formattedStakedLiq1.mul(tokenPrices.token1);

    const formattedEmissionsUSD = formattedEmissions.mul(tokenPrices.rewardsToken);

    const totalStackedUSD = formattedStacked0USD.plus(formattedStacked1USD);

    const apr = Math.abs(formattedEmissionsUSD.mul(365).div(totalStackedUSD).mul(100).toNumber());

    return apr.toFixed(2);
  };

  /**
   * Calculates APY from APR
   * @param apr - The APR as a string
   * @returns The calculated APY as a string
   */
  public static calculateAPY = ({ apr }: { apr: string }) => {
    const dpr = new Decimal(apr).div(365).div(100);
    const apy = new Decimal(1).plus(dpr).pow(365).minus(1).mul(100).toFixed(2);
    return apy;
  };
}
