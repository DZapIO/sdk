import { isAddress } from 'viem';
import { getPublicClient } from '..';
import { erc20Abi } from '../../artifacts';
import { erc20Functions } from '../../constants/erc20';
import { ChainData, HexString } from '../../types';
import { AddressClassifyResult, AddressKind } from '../../types/address';
import { formatToken, isNativeCurrency } from '../tokens';

const EIP7702_DELEGATION_PREFIX = '0xef0100';
const EIP7702_DELEGATION_HEX_LENGTH = 2 + 23 * 2;

function isEip7702DelegationCode(bytecode: HexString): boolean {
  const normalized = bytecode.toLowerCase();
  return normalized.startsWith(EIP7702_DELEGATION_PREFIX) && normalized.length === EIP7702_DELEGATION_HEX_LENGTH;
}

export async function classifyEvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressClassifyResult | null> {
  const { chainId, rpcUrls, chainConfig } = params;
  const address = formatToken(params.address) as HexString;

  if (!isAddress(address)) {
    return {
      valid: false,
      kind: AddressKind.INVALID,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  if (isNativeCurrency(address, chainConfig)) {
    return {
      valid: true,
      kind: AddressKind.NATIVE,
      isNative: true,
      isToken: true,
      isContract: false,
      address,
    };
  }

  const publicClient = getPublicClient({ rpcUrls, chainId });
  // Kick off decimals() immediately so token addresses do not pay for two
  // back-to-back RPC round trips. We still rely on getCode() to determine
  // whether the address is a wallet or a deployed contract.
  const decimalsPromise = publicClient
    .readContract({
      address,
      abi: erc20Abi,
      functionName: erc20Functions.decimals,
    })
    .then(() => true)
    .catch(() => false);

  let bytecode: HexString | undefined;
  try {
    bytecode = await publicClient.getCode({ address });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (getCode): ${message}`);
    // Network failure — cannot determine type, return null so the caller can fallback
    return null;
  }

  if (!bytecode || bytecode === '0x' || isEip7702DelegationCode(bytecode)) {
    return {
      valid: true,
      kind: AddressKind.WALLET,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  // bytecode is present → this is a deployed contract (not an EIP-7702 delegated EOA).
  // Use the already in-flight decimals() call to distinguish ERC-20 tokens from generic contracts.
  // A successful decimals() means TOKEN; a revert/throw means CONTRACT.
  const hasDecimals = await decimalsPromise;
  if (hasDecimals) {
    return {
      valid: true,
      kind: AddressKind.TOKEN,
      isNative: false,
      isToken: true,
      isContract: true,
      address,
    };
  }

  return {
    valid: true,
    kind: AddressKind.CONTRACT,
    isNative: false,
    isToken: false,
    isContract: true,
    address,
  };
}
