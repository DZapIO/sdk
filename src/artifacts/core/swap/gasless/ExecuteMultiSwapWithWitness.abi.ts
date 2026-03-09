/**
 * Gasless Execute Multi Swap With Witness Function ABI
 *
 * ABI for executing multiple gasless swaps using Permit2 witness functionality.
 * The witness pattern allows additional data to be included in the signature.
 *
 * @function executeMultiSwapWithWitness
 * @param _transactionId - Unique transaction identifier
 * @param _feeData - Encoded fee information
 * @param _feeVerificationSignature - Signature for fee verification
 * @param _userIntentSignature - User's signature with witness data
 * @param _feeDeadline - Fee deadline timestamp
 * @param _user - User address initiating the swaps
 * @param _tokenDepositDetails - Permit2 batch transfer details
 * @param _executorFeeInfo - Array of executor compensation details
 * @param _swapData - Array of swap parameters
 * @param _swapExecutionData - Array of DEX-specific execution data
 */
export const gaslessExecuteMultiSwapWithWitnessAbi = [
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
            internalType: 'struct TokenPermissions[]',
            name: 'permitted',
            type: 'tuple[]',
          },
          {
            internalType: 'uint256',
            name: 'nonce',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'deadline',
            type: 'uint256',
          },
        ],
        internalType: 'struct PermitBatchTransferFrom',
        name: '_tokenDepositDetails',
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
    name: 'executeMultiSwapWithWitness',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
