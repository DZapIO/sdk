import { erc20PermitAbi } from '../artifacts';
import { config } from '../config';
import { ERC20_FUNCTIONS } from '../constants/erc20';
import { DEFAULT_PERMIT_VERSION } from '../constants/permit';
import { TxnStatus } from '../enums';
import { HexString, TokenPermitData } from '../types';
import { multicall } from './multicall';

/**
 * Check if a token supports EIP-2612 permits by checking for required functions
 */
export const checkEIP2612PermitSupport = async ({
  address,
  chainId,
  rpcUrls,
  owner,
  permit,
}: {
  chainId: number;
  address: HexString;
  rpcUrls?: string[];
  owner: HexString; // Optional owner for fetching nonce
  permit?: TokenPermitData;
}): Promise<{
  supportsPermit: boolean;
  data?: {
    version: string;
    name: string;
    nonce: bigint;
  };
}> => {
  if (permit?.eip2612?.supported === false || config.eip2612DisabledChains.includes(chainId)) {
    return { supportsPermit: false };
  }
  const contracts = [
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.domainSeparator,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.nonces,
      args: [owner],
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.version,
    },
    {
      address: address as HexString,
      abi: erc20PermitAbi,
      functionName: ERC20_FUNCTIONS.name,
    },
  ];

  const multicallResult = await multicall({
    chainId,
    contracts,
    rpcUrls,
    allowFailure: true,
  });

  if (multicallResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const results = multicallResult.data as Array<{ status: string; result: unknown }>;
  const [domainSeparatorResult, nonceResult, versionResult, nameResult] = results;

  if (domainSeparatorResult.status !== TxnStatus.success || nonceResult.status !== TxnStatus.success || nameResult.status !== TxnStatus.success) {
    return { supportsPermit: false };
  }

  const name = nameResult.result as string;
  const nonce = nonceResult.result as bigint;
  const version = versionResult.status === TxnStatus.success ? (versionResult.result as string) : DEFAULT_PERMIT_VERSION;

  return {
    supportsPermit: true,
    data: {
      version,
      name,
      nonce,
    },
  };
};
