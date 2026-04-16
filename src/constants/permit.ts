import { DZapPermitMode } from '../enums';
import { encodePacked, keccak256, stringToHex } from 'viem';

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

export const EIP2612_PERMIT_TYPEHASH = keccak256(stringToHex('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'));

export const EIP712_ZERO_SALT = '0x0000000000000000000000000000000000000000000000000000000000000000';
