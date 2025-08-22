import { TypedDataField, Wallet } from 'ethers';
import { HexString, PermitMode, StatusCodes, TxnStatus } from 'src';
import { GaslessTxType } from 'src/constants';
import { bridgeGaslessWitnessType, defaultWitnessType, permit2PrimaryType, swapGaslessWitnessType } from 'src/constants/permit';
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

type BasePermit2Params = {
  chainId: number;
  account: HexString;
  tokens: { address: HexString; amount?: string; index: number }[];
  service: AvailableDZapServices;
  spender: HexString;
  rpcUrls?: string[];
  sigDeadline?: bigint;
  signer: WalletClient | Wallet;
  expiration?: bigint;
  permitType: Permit2PrimaryType;
  firstTokenNonce?: bigint;
};

type DefaultParams = BasePermit2Params & {
  gasless: false;
};

export type SwapGaslessSignatureParams = {
  gasless: true;
  txType: typeof GaslessTxType.swap;
  swapDataHash: HexString;
  executorFeesHash: HexString;
  txId: HexString;
};

export type BridgeGaslessSignatureParams = {
  gasless: true;
  txType: typeof GaslessTxType.bridge;
  swapDataHash: HexString;
  adapterDataHash: HexString;
  executorFeesHash: HexString;
  txId: HexString;
};

type SwapGaslessPermitParams = BasePermit2Params &
  SwapGaslessSignatureParams & {
    gasless: true;
  };
type BridgeGaslessPermitParams = BasePermit2Params &
  BridgeGaslessSignatureParams & {
    gasless: true;
  };

export type Permit2Params = DefaultParams | SwapGaslessPermitParams | BridgeGaslessPermitParams;

export type PermitDataParams = Omit<BasePermit2Params, 'permitType' | 'tokens'> & {
  oneToMany: boolean;
  token: PermitTokenWithIndex;
  totalSrcAmount: bigint;
  permitEIP2612DisabledTokens?: string[];
  permitType: PermitMode;
} & ({ gasless: false } | SwapGaslessSignatureParams | BridgeGaslessSignatureParams);

export type BatchPermitParams = Omit<BasePermit2Params, 'permitType'> & {
  tokens: PermitToken[];
  permitType: PermitMode;
} & ({ gasless: false } | SwapGaslessSignatureParams | BridgeGaslessSignatureParams);

export type SwapAndBridgeWitnessData = {
  witness: {
    owner: HexString;
    recipient: HexString;
  };
  witnessTypeName: typeof defaultWitnessType.typeName;
  witnessType: typeof defaultWitnessType.type;
};

export type SwapGaslessWitnessData = {
  witness: {
    txId: HexString;
    user: HexString;
    executorFeesHash: HexString;
    swapDataHash: HexString;
  };
  witnessTypeName: typeof swapGaslessWitnessType.typeName;
  witnessType: typeof swapGaslessWitnessType.type;
};

export type BridgeGaslessWitnessData = {
  witness: {
    txId: HexString;
    user: HexString;
    executorFeesHash: HexString;
    swapDataHash: HexString;
    adapterDataHash: HexString;
  };
  witnessTypeName: typeof bridgeGaslessWitnessType.typeName;
  witnessType: typeof bridgeGaslessWitnessType.type;
};

export type WitnessData = SwapAndBridgeWitnessData | SwapGaslessWitnessData | BridgeGaslessWitnessData;

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
