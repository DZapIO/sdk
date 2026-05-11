import { isAddress } from 'viem';
import { getPublicClient } from '..';
import { erc20Abi } from '../../artifacts';
import { erc20Functions } from '../../constants/erc20';
import { ChainData, HexString } from '../../types';
import { AddressCheckResult, AddressKind } from '../../types/address';
import { formatToken, isNativeCurrency } from '../tokens';

export async function classifyEvmAddress(params: {
  address: string;
  chainId: number;
  chainConfig: ChainData;
  rpcUrls?: string[];
}): Promise<AddressCheckResult> {
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

  let bytecode: HexString | undefined;
  try {
    bytecode = await publicClient.getCode({ address });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`RPC error (getCode): ${message}`);
  }

  if (!bytecode || bytecode === '0x') {
    return {
      valid: true,
      kind: AddressKind.EOA,
      isNative: false,
      isToken: false,
      isContract: false,
      address,
    };
  }

  try {
    await publicClient.readContract({
      address,
      abi: erc20Abi,
      functionName: erc20Functions.decimals,
    });
    return {
      valid: true,
      kind: AddressKind.TOKEN,
      isNative: false,
      isToken: true,
      isContract: true,
      address,
    };
  } catch {
    return {
      valid: true,
      kind: AddressKind.CONTRACT,
      isNative: false,
      isToken: false,
      isContract: true,
      address,
    };
  }
}
