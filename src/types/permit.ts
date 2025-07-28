import { TypedDataField, Wallet } from 'ethers';
import { HexString, PermitMode, StatusCodes, TxnStatus } from 'src';
import { permit2PrimaryType } from 'src/constants/permit';
import { Address, TypedDataDomain, WalletClient } from 'viem';
import { AvailableDZapServices } from '.';

export type Permit2PrimaryType = (typeof permit2PrimaryType)[keyof typeof permit2PrimaryType];

export type PermitResponse = {
  status: TxnStatus;
  code: StatusCodes;
  permitData?: HexString;
  nonce?: bigint;
  permitType: PermitMode;
};

export type BatchPermitResponse = Omit<PermitResponse, 'permitType'> & {
  permitType: (typeof permit2PrimaryType.PermitBatchWitnessTransferFrom)[keyof typeof permit2PrimaryType.PermitBatchWitnessTransferFrom];
};

export type PermitToken = {
  address: HexString;
  amount: string;
};

export type PermitTokenWithIndex = PermitToken & { index: number };

// generatePermitDataParams defines the parameters required for generating permit data, including tokens, chain ID, RPC URLs, sender, spender, signer, and service.
export type GeneratePermitDataParams = {
  chainId: number;
  rpcUrls?: string[];
  sender: HexString;
  spender: HexString;
  signer: WalletClient | Wallet;
  service: AvailableDZapServices;
  token: PermitTokenWithIndex;
  firstTokenNonce?: bigint;
  oneToMany: boolean;
  totalSrcAmount: bigint;
  permitType: PermitMode;
};
export type GenerateBatchPermitParams = Omit<
  GeneratePermitDataParams,
  'firstTokenNonce' | 'oneToMany' | 'totalSrcAmount' | 'permitType' | 'token'
> & { tokens: PermitToken[] };

export type Witness = {
  witness: {
    owner: HexString;
    recipient: HexString;
  };
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
  tokens: {
    address: HexString;
    amount: bigint;
    index: number;
  }[];
  expiration?: bigint;
  firstTokenNonce: bigint | null;
  primaryType: Permit2PrimaryType;
};

export const BatchPermitAbiParams = [
  {
    name: 'permit',
    type: 'tuple',
    components: [
      {
        name: 'permitted',
        type: 'tuple[]',
        components: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  { name: 'permitSignature', type: 'bytes' },
] as const;
