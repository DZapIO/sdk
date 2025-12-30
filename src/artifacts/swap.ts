export const SwapAbisByFunctionName = {
  SingleSwap: [
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
          internalType: 'struct InputToken',
          name: '_inputTokens',
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
      name: 'swap',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
  ] as const,

  BatchPermitSwapAbi: [
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
          internalType: 'bytes',
          name: '_batchDepositSignature',
          type: 'bytes',
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
  ] as const,

  MultiSwapAbi: [
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
  ] as const,

  GaslessExecuteMultiSwapAbi: [
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
  ] as const,

  GaslessExecuteMultiSwapWithWitnessAbi: [
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
  ] as const,

  GaslessExecuteSwapAbi: [
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
  ] as const,
};
