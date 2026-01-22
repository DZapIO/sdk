export const DzapUserIntentSwapTypes = {
  SignedGasLessSwapData: [
    { name: 'txId', type: 'bytes32' },
    { name: 'user', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'executorFeesHash', type: 'bytes32' },
    { name: 'swapDataHash', type: 'bytes32' },
  ],
};

export const DzapUserIntentBridgeTypes = {
  SignedGasLessBridgeData: [
    { name: 'txId', type: 'bytes32' },
    { name: 'user', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'executorFeesHash', type: 'bytes32' },
    { name: 'adapterDataHash', type: 'bytes32' },
  ],
};

export const DzapUserIntentSwapBridgeTypes = {
  SignedGasLessSwapBridgeData: [
    { name: 'txId', type: 'bytes32' },
    { name: 'user', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'executorFeesHash', type: 'bytes32' },
    { name: 'swapDataHash', type: 'bytes32' },
    { name: 'adapterDataHash', type: 'bytes32' },
  ],
};

export type DzapUserIntentSwapType = typeof DzapUserIntentSwapTypes;
export type DzapUserIntentBridgeType = typeof DzapUserIntentBridgeTypes;
export type DzapUserIntentSwapBridgeType = typeof DzapUserIntentSwapBridgeTypes;
