import { TypedDataField, Wallet } from 'ethers';
import { TypedDataDomain, WalletClient } from 'viem';
import { HexString } from 'src/types';
import { isTypeSigner } from './index';

/**
 * Helper function to sign typed data with either ethers or viem signer
 */
export const signTypedData = async ({
  signer,
  domain,
  message,
  types,
  account,
  primaryType,
}: {
  signer: WalletClient | Wallet;
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>;
  account: string;
  primaryType: string;
}): Promise<HexString> => {
  let signature: HexString;

  if (isTypeSigner(signer)) {
    signature = (await signer._signTypedData(domain, types, message)) as HexString;
  } else {
    signature = await signer.signTypedData({
      account: account as HexString,
      domain,
      message,
      primaryType,
      types,
    });
  }

  return signature;
};
