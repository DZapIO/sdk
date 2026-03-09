/**
 * Gasless Execute Multi Swap Function ABI
 *
 * ABI for executing multiple swaps without requiring the user to pay gas.
 * Enables batching multiple gasless operations in a single transaction.
 *
 * @function executeMultiSwap
 * @param _transactionId - Unique transaction identifier
 * @param _feeData - Encoded fee information
 * @param _feeVerificationSignature - Signature for fee verification
 * @param _userIntentSignature - User's signature authorizing the swaps
 * @param _userIntentDeadline - User intent signature deadline
 * @param _feeDeadline - Fee deadline timestamp
 * @param _user - User address initiating the swaps
 * @param _inputTokens - Array of input tokens
 * @param _executorFeeInfo - Array of executor compensation details
 * @param _swapData - Array of swap parameters
 * @param _swapExecutionData - Array of DEX-specific execution data
 */
export const gaslessExecuteMultiSwapAbi = [
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
        internalType: 'bytes',
        name: '_userIntentSignature',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: '_userIntentDeadline',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_feeDeadline',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_user',
        type: 'address',
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
            name: 'token',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        internalType: 'struct TokenInfo[]',
        name: '_executorFeeInfo',
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
    ],
    name: 'executeMultiSwap',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
