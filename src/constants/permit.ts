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
