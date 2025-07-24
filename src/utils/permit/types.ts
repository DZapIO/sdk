import { TypedDataField } from 'ethers';
import { HexString } from 'src';
import { permit2PrimaryType } from 'src/constants/permit';
import { Address, TypedDataDomain } from 'viem';

export type Permit2PrimaryType = (typeof permit2PrimaryType)[keyof typeof permit2PrimaryType];

export type Witness = {
  witness: any;
  witnessTypeName: string;
  witnessType: Record<string, { name: string; type: string }[]>;
};

export type TokenPermissions = {
  token: Address;
  amount: bigint;
};

export type PermitSingle = {
  details: {
    token: Address;
    amount: bigint;
    expiration: bigint;
    nonce: number;
  };
  spender: Address;
  sigDeadline: bigint;
};
export type PermitTransferFrom = {
  permitted: TokenPermissions;
  spender: Address;
  nonce: bigint;
  deadline: bigint;
};

export type PermitBatchTransferFrom = {
  permitted: TokenPermissions[];
  spender: Address;
  nonce: bigint;
  deadline: bigint;
};

export type PermitSingleData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitSingle;
};
export type PermitTransferFromData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitTransferFrom;
};

export type PermitBatchTransferFromData = {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: PermitBatchTransferFrom;
};

export type Permit2ValuesParams = {
  spender: HexString;
  account: HexString;
  deadline: bigint;
  chainId: number;
  permit2Address: HexString;
  rpcUrls?: string[];
  permitted: TokenPermissions[];
  expiration?: bigint;
  primaryType: Permit2PrimaryType;
};
