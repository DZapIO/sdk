import { DZapPermitMode } from 'src/enums';

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

export const witnessTypeName = 'DZapTransferWitness';
export const witnessType = {
  DZapTransferWitness: [
    { name: 'owner', type: 'address' },
    { name: 'recipient', type: 'address' },
  ],
};

export const PermitToDZapPermitMode = {
  [PermitTypes.EIP2612Permit]: DZapPermitMode.PERMIT,
  [PermitTypes.PermitSingle]: DZapPermitMode.PERMIT2_APPROVE,
  [PermitTypes.PermitWitnessTransferFrom]: DZapPermitMode.PERMIT2_WITNESS_TRANSFER,
  [PermitTypes.PermitBatchWitnessTransferFrom]: DZapPermitMode.BATCH_PERMIT2_WITNESS_TRANSFER,
} as const;
