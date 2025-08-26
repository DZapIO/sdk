import { Signer } from 'ethers';
import { HexString, PermitMode, StatusCodes, TxnStatus } from 'src';
import { GaslessTxType } from 'src/constants';
import { permit2PrimaryType } from 'src/constants/permit';
import { Address, WalletClient } from 'viem';

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

export type TokenWithBigIntAndIndex = {
  amount: bigint;
} & Omit<TokenWithIndex, 'amount'>;

type TokenWithOptionalAmount = {
  amount?: string;
} & Omit<TokenWithIndex, 'amount'>;

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
};

/**
 * Traditional EIP-2612 permit (user pays gas)
 */
export type Eip2612Permit = {
  token: TokenWithOptionalAmount;
  gasless: false;
  version: string;
} & BasePermitParams;

/**
 * Custom DZAP gasless signature permit for swap operations
 */
type DzapGaslessSwapPermit = {} & BasePermitParams & GaslessSwapParams;

/**
 * Custom DZAP gasless signature permit for bridge operations
 */
type DzapGaslessBridgePermit = {} & BasePermitParams & GaslessBridgeParams;

/**
 * Union of all custom DZAP gasless permit configurations
 */
export type GaslessDzapPermit = DzapGaslessSwapPermit | DzapGaslessBridgePermit;

export type BasePermit2Params = {
  tokens: { address: HexString; amount?: string; index: number }[];
  expiration?: bigint;
  permitType: Permit2PrimaryType;
  firstTokenNonce?: bigint;
} & BasePermitParams;

type DefaultPermit2Params = {
  gasless: false;
} & BasePermit2Params;
type GaslessSwapPermit2Params = {} & BasePermit2Params & GaslessSwapParams;

type GaslessBridgePermit2Params = {} & BasePermit2Params & GaslessBridgeParams;

export type Permit2Params = DefaultPermit2Params | GaslessSwapPermit2Params | GaslessBridgePermit2Params;

export type PermitParams = Eip2612Permit | Permit2Params | GaslessDzapPermit;

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

type DefaultWitnessData = {
  owner: HexString;
  recipient: HexString;
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

export type SwapAndBridgeWitnessData = BaseWitnessStructure<DefaultWitnessData, typeof defaultWitnessType.typeName, typeof defaultWitnessType.type>;

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

export type WitnessData = SwapAndBridgeWitnessData | SwapGaslessWitnessData | BridgeGaslessWitnessData;

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
