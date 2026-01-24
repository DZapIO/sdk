import type { Signer } from 'ethers';
import type { WalletClient } from 'viem';

import type { ContractVersion, StatusCodes, TxnStatus } from '../../enums';
import type { AvailableDZapServices, HexString, PermitMode, TokenPermitData } from '../../types';
import type { Permit2612Params } from './eip2612/types';
import type { Permit2Params } from './permit2/types';

export type TokenWithPermitData = {
  index: number;
  address: HexString;
  amount: string;
  permit?: TokenPermitData;
};

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

export type BasePermitResponse = {
  status: TxnStatus;
  code: StatusCodes;
  permitData?: HexString;
  nonce?: bigint;
};

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

export type PermitResponse = {
  permitType: PermitMode;
} & BasePermitResponse;
