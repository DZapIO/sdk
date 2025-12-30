import { DZapPermitMode } from '../../enums';
import { encodePacked, keccak256 } from 'viem';
import { encodeAbiParameters, parseAbiParameters } from 'viem';

export const eip2612GaslessDomain = {
  name: 'DZapVerifier',
  version: '1',
  salt: keccak256(encodePacked(['string'], ['DZap-v0.1'])),
};

export const dZapIntentPrimaryType = {
  SignedGasLessSwapData: 'SignedGasLessSwapData',
  SignedGasLessSwapBridgeData: 'SignedGasLessSwapBridgeData',
  SignedGasLessBridgeData: 'SignedGasLessBridgeData',
};

export const permit2PrimaryType = {
  PermitSingle: 'PermitSingle',
  PermitWitnessTransferFrom: 'PermitWitnessTransferFrom',
  PermitBatchWitnessTransferFrom: 'PermitBatchWitnessTransferFrom',
} as const;

export const PermitTypes = {
  PermitSingle: 'PermitSingle',
  PermitWitnessTransferFrom: 'PermitWitnessTransferFrom',
  PermitBatchWitnessTransferFrom: 'PermitBatchWitnessTransferFrom',
  EIP2612Permit: 'EIP2612Permit',
  AutoPermit: 'AutoPermit',
} as const;

export const PermitToDZapPermitMode = {
  [PermitTypes.EIP2612Permit]: DZapPermitMode.PERMIT,
  [PermitTypes.PermitSingle]: DZapPermitMode.PERMIT2_APPROVE,
  [PermitTypes.PermitWitnessTransferFrom]: DZapPermitMode.PERMIT2_WITNESS_TRANSFER,
  [PermitTypes.PermitBatchWitnessTransferFrom]: DZapPermitMode.BATCH_PERMIT2_WITNESS_TRANSFER,
} as const;

export const DEFAULT_PERMIT_DATA = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [DZapPermitMode.PERMIT, '0x']);
export const DEFAULT_PERMIT2_DATA = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [DZapPermitMode.PERMIT2_APPROVE, '0x']);

export const SIGNATURE_EXPIRY_IN_SECS = 30 * 60; // 30 minutes
export const DEFAULT_PERMIT_VERSION = '1';
