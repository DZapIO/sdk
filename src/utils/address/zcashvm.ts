import { utils } from 'ethers';
import { AddressClassifyResult, AddressKind } from '../../types/address';

const zcashTransparentPrefixes = ['0x1cb8', '0x1cbd'];

export const isValidZcashAddress = (address: string): boolean => {
  try {
    const decoded = utils.base58.decode(address);
    return (
      decoded.length === 26 &&
      zcashTransparentPrefixes.includes(utils.hexDataSlice(decoded, 0, 2)) &&
      utils.hexDataSlice(decoded, 22) === utils.hexDataSlice(utils.sha256(utils.sha256(decoded.slice(0, 22))), 0, 4)
    );
  } catch {
    return false;
  }
};

export async function classifyZcashvmAddress({ address }: { address: string }): Promise<AddressClassifyResult> {
  const valid = isValidZcashAddress(address);
  return {
    valid,
    kind: valid ? AddressKind.WALLET : AddressKind.INVALID,
    isNative: false,
    isToken: false,
    isContract: false,
    address,
  };
}
