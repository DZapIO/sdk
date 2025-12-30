import { Signer, TypedDataField, Wallet } from 'ethers';
import { TypedDataDomain, WalletClient } from 'viem';
import { HexString } from '../types';

export const isTypeSigner = (variable: unknown): variable is Signer => {
  return variable instanceof Signer;
};

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
  signer: WalletClient | Signer;
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>;
  account: string;
  primaryType: string;
}): Promise<HexString> => {
  let signature: HexString;

  if (isTypeSigner(signer)) {
    signature = (await (signer as Wallet)._signTypedData(domain, types, message)) as HexString;
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
