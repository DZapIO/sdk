import type { Address } from 'viem';

import type { Permit2PrimaryTypes } from '../../../constants/permit';
import type { HexString } from '../../../types';
import type { GaslessBridgeParams, GaslessSwapParams } from '../../../types/gasless';
import type { BasePermitParams, BasePermitResponse, TokenWithPermitData } from '../types';

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

export type Permit2PrimaryType = (typeof Permit2PrimaryTypes)[keyof typeof Permit2PrimaryTypes];

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

export type BatchPermitResponse = {
  permitType: typeof Permit2PrimaryTypes.PermitBatchWitnessTransferFrom;
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
