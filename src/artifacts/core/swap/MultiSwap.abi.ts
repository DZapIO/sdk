/**
 * Multi Swap Function ABI
 *
 * ABI for executing multiple token swaps in a single transaction.
 * Supports batching multiple swap operations with individual permit data.
 *
 * @function swap
 * @param _transactionId - Unique transaction identifier
 * @param _feeData - Encoded fee information
 * @param _feeVerificationSignature - Signature for fee verification
 * @param _deadline - Transaction deadline timestamp
 * @param _inputTokens - Array of input tokens with permit data
 * @param _swapData - Array of swap parameters for each operation
 * @param _swapExecutionData - Array of DEX-specific execution data
 * @param withoutRevert - If true, continues execution even if individual swaps fail
 */
export const multiSwapAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: '_feeData',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: '_feeVerificationSignature',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: '_deadline',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct InputToken[]',
        name: '_inputTokens',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'recipient',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'fromAmount',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'minToAmount',
            type: 'uint256',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_swapData',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'dex',
            type: 'string',
          },
          {
            internalType: 'address',
            name: 'callTo',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'approveTo',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bool',
            name: 'isDirectTransfer',
            type: 'bool',
          },
        ],
        internalType: 'struct SwapExecutionData[]',
        name: '_swapExecutionData',
        type: 'tuple[]',
      },
      {
        internalType: 'bool',
        name: 'withoutRevert',
        type: 'bool',
      },
    ],
    name: 'swap',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
