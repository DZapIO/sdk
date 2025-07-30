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

export const defaultWitness = {
  witnessTypeName: 'DZapTransferWitness',
  witnessType: {
    DZapTransferWitness: [
      { name: 'owner', type: 'address' },
      { name: 'recipient', type: 'address' },
    ],
  },
};

export const swapGaslessWitness = {
  witnessTypeName: 'DZapSwapWitness',
  witnessType: {
    DZapSwapWitness: [
      { name: 'txId', type: 'bytes32' },
      { name: 'user', type: 'address' },
      { name: 'executorFeesHash', type: 'bytes32' },
      { name: 'swapDataHash', type: 'bytes32' },
    ],
  },
};

export const bridgeGaslessWitness = {
  witnessTypeName: 'DZapBridgeWitness',
  witnessType: {
    DZapBridgeWitness: [
      { name: 'txId', type: 'bytes32' },
      { name: 'user', type: 'address' },
      { name: 'executorFeesHash', type: 'bytes32' },
      { name: 'swapDataHash', type: 'bytes32' },
      { name: 'adapterDataHash', type: 'bytes32' },
    ],
  },
};

export const PermitToDZapPermitMode = {
  [PermitTypes.EIP2612Permit]: DZapPermitMode.PERMIT,
  [PermitTypes.PermitSingle]: DZapPermitMode.PERMIT2_APPROVE,
  [PermitTypes.PermitWitnessTransferFrom]: DZapPermitMode.PERMIT2_WITNESS_TRANSFER,
  [PermitTypes.PermitBatchWitnessTransferFrom]: DZapPermitMode.BATCH_PERMIT2_WITNESS_TRANSFER,
} as const;
