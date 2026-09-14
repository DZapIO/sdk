import { TypedDataDomain, TypedDataParameter, WalletClient } from 'viem';
import { HexString } from '../types';

/**
 * Helper function to sign typed data with a viem wallet client
 */
export const signTypedData = async ({
  signer,
  domain,
  message,
  types,
  account,
  primaryType,
}: {
  signer: WalletClient;
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataParameter>>;
  message: Record<string, any>;
  account: string;
  primaryType: string;
}): Promise<HexString> => {
  return signer.signTypedData({
    account: account as HexString,
    domain,
    message,
    primaryType,
    types,
  });
};
