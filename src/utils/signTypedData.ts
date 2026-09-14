import type { Signer, TypedDataField } from 'ethers';
import { TypedDataDomain, WalletClient } from 'viem';
import { HexString } from '../types';
import { isTypeSigner } from './index';

/**
 * The one method this module needs from an ethers v5 signer.
 *
 * Declared locally rather than importing ethers' `Wallet` so that `ethers`
 * stays a type-only dependency: `_signTypedData` is not on the abstract
 * `Signer` type, but every concrete v5 signer implements it.
 */
type EthersTypedDataSigner = {
  _signTypedData: (domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, message: Record<string, unknown>) => Promise<string>;
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
    signature = (await (signer as unknown as EthersTypedDataSigner)._signTypedData(domain, types, message)) as HexString;
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
