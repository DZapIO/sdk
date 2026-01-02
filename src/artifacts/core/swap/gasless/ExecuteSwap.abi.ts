/**
 * Gasless Execute Swap Function ABI
 *
 * ABI for executing a single swap without requiring the user to pay gas.
 * The executor pays gas fees and is compensated through executor fee tokens.
 *
 * @function executeSwap
 * @param _transactionId - Unique transaction identifier
 * @param _feeData - Encoded fee information
 * @param _feeVerificationSignature - Signature for fee verification
 * @param _userIntentSignature - User's signature authorizing the swap
 * @param _userIntentDeadline - User intent signature deadline
 * @param _feeDeadline - Fee deadline timestamp
 * @param _user - User address initiating the swap
 * @param _inputToken - Input token details
 * @param _executorFeeInfo - Executor compensation details
 * @param _swapData - Swap parameters
 * @param _swapExecutionData - DEX-specific execution data
 */
export const gaslessExecuteSwapAbi = [
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
        internalType: 'struct InputToken',
        name: '_inputToken',
        type: 'tuple',
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
        internalType: 'struct TokenInfo',
        name: '_executorFeeInfo',
        type: 'tuple',
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
        internalType: 'struct SwapData',
        name: '_swapData',
        type: 'tuple',
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
        internalType: 'struct SwapExecutionData',
        name: '_swapExecutionData',
        type: 'tuple',
      },
    ],
    name: 'executeSwap',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
