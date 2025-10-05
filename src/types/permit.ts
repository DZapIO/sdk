import { Signer } from 'ethers';
import { HexString, PermitMode, StatusCodes, TxnStatus } from 'src';
import { GaslessTxType } from 'src/constants';
import { permit2PrimaryType } from 'src/constants/permit';
import { ContractVersion } from 'src/enums';
import { Address, WalletClient } from 'viem';
import { AvailableDZapServices, TokenPermitData } from '.';

export const defaultWitnessType = {
  typeName: 'DZapTransferWitness',
  type: {
    DZapTransferWitness: [
      { name: 'owner', type: 'address' },
      { name: 'recipient', type: 'address' },
    ],
  },
};

export const swapGaslessWitnessType = {
  typeName: 'DZapSwapWitness',
  type: {
    DZapSwapWitness: [
      { name: 'txId', type: 'bytes32' },
      { name: 'user', type: 'address' },
      { name: 'executorFeesHash', type: 'bytes32' },
      { name: 'swapDataHash', type: 'bytes32' },
    ],
  },
};

export const bridgeGaslessWitnessType = {
  typeName: 'DZapBridgeWitness',
  type: {
    DZapBridgeWitness: [
      { name: 'txId', type: 'bytes32' },
      { name: 'user', type: 'address' },
      { name: 'executorFeesHash', type: 'bytes32' },
      { name: 'swapDataHash', type: 'bytes32' },
      { name: 'adapterDataHash', type: 'bytes32' },
    ],
  },
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

export type TokenWithPermitData = {
  index: number;
  address: HexString;
  amount: string;
  permit?: TokenPermitData;
};

export type Permit2PrimaryType = (typeof permit2PrimaryType)[keyof typeof permit2PrimaryType];

// Gasless common types
type GaslessBaseParams = {
  gasless: true;
  txId: HexString;
  executorFeesHash: HexString;
};

export type GaslessSwapParams = {
  txType: typeof GaslessTxType.swap;
  swapDataHash: HexString;
} & GaslessBaseParams;

export type GaslessBridgeParams = {
  txType: typeof GaslessTxType.bridge;
  adapterDataHash: HexString;
  swapDataHash?: HexString;
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
  contractVersion: ContractVersion;
  service: AvailableDZapServices;
};

/**
 * Traditional EIP-2612 permit (user pays gas)
 */
type Permit2612BaseParams = {
  token: TokenWithPermitData;
  version: string;
  sigDeadline?: bigint;
  amount?: bigint;
  name: string;
  nonce: bigint;
} & BasePermitParams;

export type DefaultPermit2612Params = {
  gasless: false;
} & Permit2612BaseParams;

/**
 * Custom DZAP(Eip-2612) gasless signature permit for swap operations
 */
type GaslessSwapPermit2612Params = BasePermitParams & GaslessSwapParams;

/**
 * Custom DZAP gasless signature permit for bridge operations
 */
type GaslessBridgePermit2612Params = BasePermitParams & GaslessBridgeParams;

/**
 * Union of all custom DZAP gasless permit configurations
 */
export type Gasless2612PermitParams = GaslessSwapPermit2612Params | GaslessBridgePermit2612Params;

/**
 * Union of all EIP-2612 permit configurations
 * Supports both gasless and traditional permit flows
 */
export type Permit2612Params = DefaultPermit2612Params | Gasless2612PermitParams;

export type BasePermit2Params = {
  tokens: TokenWithPermitData[];
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
  permitType: typeof permit2PrimaryType.PermitBatchWitnessTransferFrom;
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
