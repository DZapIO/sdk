import type { TypedDataField, Wallet } from 'ethers';
import { Signer } from 'ethers';
import type { TypedDataDomain, WalletClient } from 'viem';

import type { HexString } from '../types';

export const isEthersSigner = (variable: unknown): variable is Signer => {
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

  if (isEthersSigner(signer)) {
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
