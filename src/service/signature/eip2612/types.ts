import type { GaslessBridgeParams, GaslessSwapParams } from '../../../types/gasless';
import type { BasePermitParams, TokenWithPermitData } from '../types';

export const EIP2612DefaultTypes = {
  Permit: [
    {
      name: 'owner',
      type: 'address',
    },
    {
      name: 'spender',
      type: 'address',
    },
    {
      name: 'value',
      type: 'uint256',
    },
    {
      name: 'nonce',
      type: 'uint256',
    },
    {
      name: 'deadline',
      type: 'uint256',
    },
  ],
};

export type EIP2612Types = typeof EIP2612DefaultTypes;

type Permit2612BaseParams = {
  token: TokenWithPermitData;
  version: string;
  sigDeadline?: bigint;
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
