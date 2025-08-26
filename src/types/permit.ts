import { Signer } from 'ethers';
import { HexString, PermitMode, StatusCodes, TxnStatus } from 'src';
import { GaslessTxType } from 'src/constants';
import { bridgeGaslessWitnessType, defaultWitnessType, permit2PrimaryType, swapGaslessWitnessType } from 'src/constants/permit';
import { Address, WalletClient } from 'viem';

//common types for permit

/**
 * Base token for permit, address and amount
 */
type BaseToken = {
  address: HexString;
  amount: string;
};

export type TokenWithIndex = {
  index: number;
} & BaseToken;

type TokenPermissions = {
  token: Address;
  amount: bigint;
};

export type Permit2PrimaryType = (typeof permit2PrimaryType)[keyof typeof permit2PrimaryType];

// Gasless common types
type GaslessBaseParams = {
  gasless: true;
  txId: HexString;
  executorFeesHash: HexString;
  swapDataHash: HexString;
};

export type GaslessSwapParams = {
  txType: typeof GaslessTxType.swap;
} & GaslessBaseParams;

export type GaslessBridgeParams = {
  txType: typeof GaslessTxType.bridge;
  adapterDataHash: HexString;
} & GaslessBaseParams;

/**
 * Core parameters required for any permit operation
 * Foundation for both EIP-2612 and Permit2 signatures
 */
export type BasePermitParams = {
  chainId: number;
  account: HexString;
  spender: HexString;
  rpcUrls?: string[];
  deadline?: bigint;
  signer: WalletClient | Signer;
};

//EIP-2612 PERMIT TYPES

/**
 * Base configuration for EIP-2612 permit operations
 */
type Permit2612BaseParams = {
  token: {
    amount?: bigint;
  } & Omit<TokenWithIndex, 'amount'>;
  version: string;
} & BasePermitParams;

/**
 * Traditional EIP-2612 permit (user pays gas)
 */
type DefaultPermit2612Params = {
  gasless: false;
} & Permit2612BaseParams;

/**
 * Gasless EIP-2612 permit for swap operations
 */
type GaslessSwapPermit2612Params = Permit2612BaseParams & GaslessSwapParams;

/**
 * Gasless EIP-2612 permit for bridge operations
 */
type GaslessBridgePermit2612Params = Permit2612BaseParams & GaslessBridgeParams;

/**
 * Union of all EIP-2612 permit configurations
 * Supports both gasless and traditional permit flows
 */
export type Permit2612Params = DefaultPermit2612Params | GaslessSwapPermit2612Params | GaslessBridgePermit2612Params;

export type BasePermit2Params = {
  tokens: { address: HexString; amount?: string; index: number }[];
  expiration?: bigint;
  permitType: Permit2PrimaryType;
  firstTokenNonce?: bigint;
} & BasePermitParams;

type DefaultPermit2Params = {
  gasless: false;
} & BasePermit2Params;
type GaslessSwapPermit2Params = BasePermit2Params & GaslessSwapParams;

type GaslessBridgePermit2Params = BasePermit2Params & GaslessBridgeParams;

export type Permit2Params = DefaultPermit2Params | GaslessSwapPermit2Params | GaslessBridgePermit2Params;

/**
 * Complete permit configuration union
 * Supports both EIP-2612 and Permit2 operations with all gasless variants
 *
 * Type Hierarchy:
 * PermitConfiguration
 * ├── Permit2612Params (EIP-2612 permits)
 * │   ├── StandardPermit2612 (gasless: false)
 * │   ├── GaslessSwapPermit2612 (gasless: true, txType: swap)
 * │   └── GaslessBridgePermit2612 (gasless: true, txType: bridge)
 * └── Permit2Params (Permit2 batch permits)
 *     ├── StandardPermit2 (gasless: false)
 *     ├── GaslessSwapPermit2 (gasless: true, txType: swap)
 *     └── GaslessBridgePermit2 (gasless: true, txType: bridge)
 */
export type PermitParams = Permit2612Params | Permit2Params;

//Core permit operation response data
export type BasePermitResponse = {
  status: TxnStatus;
  code: StatusCodes;
  permitData?: HexString;
  nonce?: bigint;
};

export type PermitResponse = {
  permitType: PermitMode;
} & BasePermitResponse;

export type BatchPermitResponse = {
  permitType: (typeof permit2PrimaryType.PermitBatchWitnessTransferFrom)[keyof typeof permit2PrimaryType.PermitBatchWitnessTransferFrom];
} & BasePermitResponse;

// WITNESS DATA TYPES

/**
 * Generic witness data structure
 * Template for all witness types with type safety
 */
type BaseWitnessStructure<T, N extends string, TType> = {
  witness: T;
  witnessTypeName: N;
  witnessType: TType;
};

type GaslessWitnessData = {
  txId: HexString;
  user: HexString;
  executorFeesHash: HexString;
  swapDataHash: HexString;
};

type BridgeWitnessData = {
  adapterDataHash: HexString;
} & GaslessWitnessData;

export type DefaultWitnessData = BaseWitnessStructure<
  {
    owner: HexString;
    recipient: HexString;
  },
  typeof defaultWitnessType.typeName,
  typeof defaultWitnessType.type
>;

export type SwapGaslessWitnessData = BaseWitnessStructure<
  GaslessWitnessData,
  typeof swapGaslessWitnessType.typeName,
  typeof swapGaslessWitnessType.type
>;

export type BridgeGaslessWitnessData = BaseWitnessStructure<
  BridgeWitnessData,
  typeof bridgeGaslessWitnessType.typeName,
  typeof bridgeGaslessWitnessType.type
>;

export type WitnessData = DefaultWitnessData | SwapGaslessWitnessData | BridgeGaslessWitnessData;

export type PermitSingleValues = {
  details: {
    token: Address;
    amount: bigint;
    expiration: bigint;
    nonce: number;
  };
  spender: Address;
  sigDeadline: bigint;
};
export type PermitTransferFromValues = {
  permitted: TokenPermissions;
  spender: Address;
  nonce: bigint;
  deadline: bigint;
};

export type PermitBatchTransferFromValues = {
  permitted: TokenPermissions[];
  spender: Address;
  nonce: bigint;
  deadline: bigint;
};
