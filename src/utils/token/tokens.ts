import { getAddress, isAddress, zeroAddress } from 'viem';
import { NATIVE_TOKENS } from '../../constants/tokens';
import { ChainData, HexString } from '../../types';

export const isNativeCurrency = (address: string, chainConfig: ChainData) => {
  if (!chainConfig) return false;
  return Object.values(chainConfig).some((chain) => chain.isEnabled && chain.nativeToken.contract === address);
};

export function isNonEVMChain(chainId: number, chainConfig: ChainData) {
  return chainConfig[chainId]?.chainType !== 'evm';
}

const isNativeAddress = (contract: string) => NATIVE_TOKENS.includes(contract);

export const getChecksumAddress = (address: string): HexString => getAddress(address);

export const formatToken = <T extends HexString | string = string>(token: T, nativeTokenAddress: T = zeroAddress as T): T => {
  if (!isAddress(token)) {
    return token;
  } else if (isNativeAddress(token)) {
    return nativeTokenAddress;
  } else {
    return getChecksumAddress(token) as T;
  }
};
