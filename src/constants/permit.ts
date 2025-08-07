import { DZapPermitMode } from 'src/enums';
import { encodePacked, keccak256 } from 'viem';

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
  ...permit2PrimaryType,
  EIP2612Permit: 'EIP2612Permit',
  AutoPermit: 'AutoPermit',
} as const;

export const PermitToDZapPermitMode = {
  [PermitTypes.EIP2612Permit]: DZapPermitMode.PERMIT,
  [PermitTypes.PermitSingle]: DZapPermitMode.PERMIT2_APPROVE,
  [PermitTypes.PermitWitnessTransferFrom]: DZapPermitMode.PERMIT2_WITNESS_TRANSFER,
  [PermitTypes.PermitBatchWitnessTransferFrom]: DZapPermitMode.BATCH_PERMIT2_WITNESS_TRANSFER,
} as const;
