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

export const PermitToDZapPermitMode = {
  [PermitTypes.EIP2612Permit]: DZapPermitMode.PERMIT,
  [PermitTypes.PermitSingle]: DZapPermitMode.PERMIT2_APPROVE,
  [PermitTypes.PermitWitnessTransferFrom]: DZapPermitMode.PERMIT2_WITNESS_TRANSFER,
  [PermitTypes.PermitBatchWitnessTransferFrom]: DZapPermitMode.BATCH_PERMIT2_WITNESS_TRANSFER,
} as const;
