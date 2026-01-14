import type { Abi } from 'viem';

/**
 * DZap Core Contract ABI (Version 1)
 *
 * Main contract for DZap protocol operations including:
 * - Token swaps
 * - Cross-chain bridges
 * - Liquidity operations
 *
 * @version 1.0
 */
export const dZapCoreAbi: Abi = [
  {
    type: 'error',
    name: 'CalldataEmptyButInitNotZero',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FacetAddressIsNotZero',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FacetAddressIsZero',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FacetContainsNoCode',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FunctionAlreadyExists',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FunctionDoesNotExist',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FunctionIsImmutable',
    inputs: [],
  },
  {
    type: 'error',
    name: 'IncorrectFacetCutAction',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InitReverted',
    inputs: [
      {
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'error',
    name: 'InitZeroButCalldataNotEmpty',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoSelectorsInFace',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ZeroAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OnlyContractOwner',
    inputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DiamondCut',
    inputs: [
      {
        type: 'tuple[]',
        name: '_diamondCut',
        components: [
          {
            type: 'address',
            name: 'facetAddress',
          },
          {
            type: 'uint8',
            name: 'action',
          },
          {
            type: 'bytes4[]',
            name: 'functionSelectors',
          },
        ],
      },
      {
        type: 'address',
        name: '_init',
        indexed: false,
      },
      {
        type: 'bytes',
        name: '_calldata',
        indexed: false,
      },
    ],
  },
  {
    type: 'function',
    name: 'diamondCut',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'tuple[]',
        name: '_diamondCut',
        components: [
          {
            type: 'address',
            name: 'facetAddress',
          },
          {
            type: 'uint8',
            name: 'action',
          },
          {
            type: 'bytes4[]',
            name: 'functionSelectors',
          },
        ],
      },
      {
        type: 'address',
        name: '_init',
      },
      {
        type: 'bytes',
        name: '_calldata',
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'AlreadyInitialized',
    inputs: [],
  },
  {
    type: 'error',
    name: 'CannotAuthorizeSelf',
    inputs: [],
  },
  {
    type: 'function',
    name: 'initialize',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_protocolFeeVault',
      },
      {
        type: 'address',
        name: '_feeValidator',
      },
      {
        type: 'address',
        name: '_refundVault',
      },
      {
        type: 'address',
        name: '_permit2',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'facetAddress',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'bytes4',
        name: '_functionSelector',
      },
    ],
    outputs: [
      {
        type: 'address',
        name: 'facetAddress_',
      },
    ],
  },
  {
    type: 'function',
    name: 'facetAddresses',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address[]',
        name: 'facetAddresses_',
      },
    ],
  },
  {
    type: 'function',
    name: 'facetFunctionSelectors',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_facet',
      },
    ],
    outputs: [
      {
        type: 'bytes4[]',
        name: 'facetFunctionSelectors_',
      },
    ],
  },
  {
    type: 'function',
    name: 'facets',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        name: 'facets_',
        components: [
          {
            type: 'address',
            name: 'facetAddress',
          },
          {
            type: 'bytes4[]',
            name: 'functionSelectors',
          },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'supportsInterface',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'bytes4',
        name: '_interfaceId',
      },
    ],
    outputs: [
      {
        type: 'bool',
        name: '',
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'OwnershipTransferred',
    inputs: [
      {
        type: 'address',
        name: 'previousOwner',
        indexed: true,
      },
      {
        type: 'address',
        name: 'newOwner',
        indexed: true,
      },
    ],
  },
  {
    type: 'function',
    name: 'owner',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: 'owner_',
      },
    ],
  },
  {
    type: 'function',
    name: 'transferOwnership',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_newOwner',
      },
    ],
    outputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'ExecutionAllowed',
    inputs: [
      {
        type: 'address',
        name: 'account',
        indexed: true,
      },
      {
        type: 'bytes4',
        name: 'method',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'ExecutionDenied',
    inputs: [
      {
        type: 'address',
        name: 'account',
        indexed: true,
      },
      {
        type: 'bytes4',
        name: 'method',
        indexed: true,
      },
    ],
  },
  {
    type: 'function',
    name: 'addressCanExecuteMethod',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'bytes4',
        name: '_selector',
      },
      {
        type: 'address',
        name: '_executor',
      },
    ],
    outputs: [
      {
        type: 'bool',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'setBatchCanExecute',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'bytes4[]',
        name: '_selector',
      },
      {
        type: 'address[]',
        name: '_executor',
      },
      {
        type: 'bool[]',
        name: '_canExecute',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setCanExecute',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'bytes4',
        name: '_selector',
      },
      {
        type: 'address',
        name: '_executor',
      },
      {
        type: 'bool',
        name: '_canExecute',
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'UnAuthorized',
    inputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'ProtocolFeeVaultUpdated',
    inputs: [
      {
        type: 'address',
        name: 'protocolFeeVault',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'RefundVaultUpdated',
    inputs: [
      {
        type: 'address',
        name: 'refundVault',
        indexed: true,
      },
    ],
  },
  {
    type: 'function',
    name: 'getProtocolFeeVault',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'getRefundVault',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'setProtocolFeeVault',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_protocolFeeVault',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setRefundVault',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_refundVault',
      },
    ],
    outputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'FeeValidatorUpdated',
    inputs: [
      {
        type: 'address',
        name: 'feeValidator',
        indexed: true,
      },
    ],
  },
  {
    type: 'function',
    name: 'getFeeValidator',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'getNonce',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_user',
      },
    ],
    outputs: [
      {
        type: 'uint256',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'setFeeValidator',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_feeValidator',
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'AdapterNotWhitelisted',
    inputs: [
      {
        type: 'address',
        name: 'adapter',
      },
    ],
  },
  {
    type: 'error',
    name: 'BridgeNotWhitelisted',
    inputs: [
      {
        type: 'address',
        name: 'bridge',
      },
    ],
  },
  {
    type: 'error',
    name: 'DexNotWhitelised',
    inputs: [
      {
        type: 'address',
        name: 'dex',
      },
    ],
  },
  {
    type: 'error',
    name: 'NotAContract',
    inputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'AdapterAdded',
    inputs: [
      {
        type: 'address',
        name: 'adapter',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'AdapterRemoved',
    inputs: [
      {
        type: 'address',
        name: 'adapter',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'AdaptersAdded',
    inputs: [
      {
        type: 'address[]',
        name: 'adapters',
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'AdaptersRemoved',
    inputs: [
      {
        type: 'address[]',
        name: 'adapters',
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BridgeAdded',
    inputs: [
      {
        type: 'address',
        name: 'bridge',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BridgeRemoved',
    inputs: [
      {
        type: 'address',
        name: 'bridge',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BridgesAdded',
    inputs: [
      {
        type: 'address[]',
        name: 'bridges',
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BridgesRemoved',
    inputs: [
      {
        type: 'address[]',
        name: 'bridges',
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DexAdded',
    inputs: [
      {
        type: 'address',
        name: 'dex',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DexRemoved',
    inputs: [
      {
        type: 'address',
        name: 'dex',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DexesAdded',
    inputs: [
      {
        type: 'address[]',
        name: 'dexes',
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DexesRemoved',
    inputs: [
      {
        type: 'address[]',
        name: 'dexes',
      },
    ],
  },
  {
    type: 'function',
    name: 'addAdapter',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_adapter',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addAdapters',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_adapters',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addBridge',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_bridge',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addBridges',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_bridges',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addDex',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_dex',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addDexesAndBridges',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_dexs',
      },
      {
        type: 'address[]',
        name: '_bridges',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addDexs',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_dexs',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isAdapterWhitelisted',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_adapter',
      },
    ],
    outputs: [
      {
        type: 'bool',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'isBridgeWhitelisted',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_bridge',
      },
    ],
    outputs: [
      {
        type: 'bool',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'isDexWhitelisted',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_dex',
      },
    ],
    outputs: [
      {
        type: 'bool',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'removeAdapter',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_adapter',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeAdapters',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_adapters',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeBridge',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_bridge',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeBridges',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_bridges',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeDex',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_dex',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeDexesAndBridges',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_dexs',
      },
      {
        type: 'address[]',
        name: '_bridges',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'removeDexs',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_dexs',
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      {
        type: 'uint256',
        name: 'amount',
      },
      {
        type: 'uint256',
        name: 'contractBalance',
      },
    ],
  },
  {
    type: 'error',
    name: 'NativeTransferFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoTransferToNullAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ReentrancyError',
    inputs: [],
  },
  {
    type: 'error',
    name: 'WithdrawFailed',
    inputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'LogWithdraw',
    inputs: [
      {
        type: 'address',
        name: 'tokenAddress',
        indexed: true,
      },
      {
        type: 'address',
        name: 'to',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'amount',
        indexed: false,
      },
    ],
  },
  {
    type: 'function',
    name: 'executeCallAndWithdraw',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_callTo',
      },
      {
        type: 'bytes',
        name: '_callData',
      },
      {
        type: 'address',
        name: '_token',
      },
      {
        type: 'address',
        name: '_to',
      },
      {
        type: 'uint256',
        name: '_amount',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_token',
      },
      {
        type: 'address',
        name: '_to',
      },
      {
        type: 'uint256',
        name: '_amount',
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermit',
    inputs: [
      {
        type: 'string',
        name: '',
      },
    ],
  },
  {
    type: 'error',
    name: 'InvalidPermitType',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoSwapFromZeroAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAValidRecipient',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAValidSpender',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SlippageTooHigh',
    inputs: [
      {
        type: 'uint256',
        name: 'minAmount',
      },
      {
        type: 'uint256',
        name: 'returnAmount',
      },
    ],
  },
  {
    type: 'error',
    name: 'SwapCallFailed',
    inputs: [
      {
        type: 'address',
        name: 'target',
      },
      {
        type: 'bytes4',
        name: 'funSig',
      },
      {
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DZapBatchTokenSwapped',
    inputs: [
      {
        type: 'bytes',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple[]',
        name: 'swapInfo',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'fromToken',
          },
          {
            type: 'address',
            name: 'toToken',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'returnToAmount',
          },
        ],
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DZapTokenSwapped',
    inputs: [
      {
        type: 'bytes',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple',
        name: 'swapInfo',
        indexed: false,
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'fromToken',
          },
          {
            type: 'address',
            name: 'toToken',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'returnToAmount',
          },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'swap',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_batchDepositSignature',
      },
      {
        type: 'tuple',
        name: '_tokenDepositDetails',
        components: [
          {
            type: 'tuple[]',
            name: 'permitted',
            components: [
              {
                type: 'address',
                name: 'token',
              },
              {
                type: 'uint256',
                name: 'amount',
              },
            ],
          },
          {
            type: 'uint256',
            name: 'nonce',
          },
          {
            type: 'uint256',
            name: 'deadline',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
      {
        type: 'bool',
        name: 'withoutRevert',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'swap',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'tuple[]',
        name: '_inputTokens',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
      {
        type: 'bool',
        name: 'withoutRevert',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'swap',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_tokenApprovalData',
      },
      {
        type: 'tuple',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'AdapterCallFailed',
    inputs: [
      {
        type: 'address',
        name: 'adapter',
      },
      {
        type: 'bytes',
        name: 'res',
      },
    ],
  },
  {
    type: 'error',
    name: 'SigDeadlineExpired',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UnauthorizedSigner',
    inputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BridgeStarted',
    inputs: [
      {
        type: 'bytes',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'user',
        indexed: true,
      },
      {
        type: 'bytes',
        name: 'receiver',
        indexed: false,
      },
      {
        type: 'string',
        name: 'bridge',
        indexed: false,
      },
      {
        type: 'address',
        name: 'bridgeAddress',
        indexed: false,
      },
      {
        type: 'address',
        name: 'from',
        indexed: false,
      },
      {
        type: 'bytes',
        name: 'to',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'amount',
        indexed: false,
      },
      {
        type: 'uint256',
        name: 'destinationChainId',
        indexed: false,
      },
      {
        type: 'bool',
        name: 'hasDestinationCall',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DZapBridgeStarted',
    inputs: [
      {
        type: 'bytes',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'user',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
    ],
  },
  {
    type: 'function',
    name: 'bridge',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_feeData',
      },
      {
        type: 'bytes',
        name: '_feeVerificationSignature',
      },
      {
        type: 'uint256',
        name: '_deadline',
      },
      {
        type: 'tuple[]',
        name: '_erc20Token',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
          {
            type: 'bool',
            name: 'updateBridgeInAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_adapterInfo',
        components: [
          {
            type: 'address',
            name: 'adapter',
          },
          {
            type: 'bytes',
            name: 'adapterData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'bridge',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_feeData',
      },
      {
        type: 'bytes',
        name: '_feeVerificationSignature',
      },
      {
        type: 'bytes',
        name: '_batchDepositSignature',
      },
      {
        type: 'uint256',
        name: '_deadline',
      },
      {
        type: 'tuple',
        name: '_tokenDepositDetails',
        components: [
          {
            type: 'tuple[]',
            name: 'permitted',
            components: [
              {
                type: 'address',
                name: 'token',
              },
              {
                type: 'uint256',
                name: 'amount',
              },
            ],
          },
          {
            type: 'uint256',
            name: 'nonce',
          },
          {
            type: 'uint256',
            name: 'deadline',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
          {
            type: 'bool',
            name: 'updateBridgeInAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_adapterInfo',
        components: [
          {
            type: 'address',
            name: 'adapter',
          },
          {
            type: 'bytes',
            name: 'adapterData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'bridge',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_feeData',
      },
      {
        type: 'bytes',
        name: '_feeVerificationSignature',
      },
      {
        type: 'uint256',
        name: '_deadline',
      },
      {
        type: 'tuple',
        name: '_intputTokens',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
          {
            type: 'bool',
            name: 'updateBridgeInAmount',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_adapterInfo',
        components: [
          {
            type: 'address',
            name: 'adapter',
          },
          {
            type: 'bytes',
            name: 'adapterData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'bridge',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_feeData',
      },
      {
        type: 'bytes',
        name: '_feeVerificationSignature',
      },
      {
        type: 'uint256',
        name: '_deadline',
      },
      {
        type: 'tuple',
        name: '_intputTokens',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_adapterInfo',
        components: [
          {
            type: 'address',
            name: 'adapter',
          },
          {
            type: 'bytes',
            name: 'adapterData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'DZapGasLessStarted',
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'executor',
        indexed: true,
      },
      {
        type: 'address',
        name: '_user',
        indexed: true,
      },
    ],
  },
  {
    type: 'function',
    name: 'executeBridge',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_bridgeFeeData',
      },
      {
        type: 'bytes',
        name: '_userIntentSignature',
      },
      {
        type: 'bytes',
        name: '_feeVerificationSignature',
      },
      {
        type: 'uint256',
        name: '_userIntentDeadline',
      },
      {
        type: 'uint256',
        name: '_bridgeFeeDeadline',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'tuple',
        name: '_inputToken',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_executorFeeInfo',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_adapterInfo',
        components: [
          {
            type: 'address',
            name: 'adapter',
          },
          {
            type: 'bytes',
            name: 'adapterData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeMultiBridge',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_bridgeFeeData',
      },
      {
        type: 'bytes',
        name: '_userIntentSignature',
      },
      {
        type: 'bytes',
        name: '_feeVerificationSignature',
      },
      {
        type: 'uint256',
        name: '_userIntentDeadline',
      },
      {
        type: 'uint256',
        name: '_bridgeFeeDeadline',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'tuple[]',
        name: '_inputTokens',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_executorFeeInfo',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
          {
            type: 'bool',
            name: 'updateBridgeInAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_adapterInfo',
        components: [
          {
            type: 'address',
            name: 'adapter',
          },
          {
            type: 'bytes',
            name: 'adapterData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeMultiBridgeBatchWithPermit2Witness',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_bridgeFeeData',
      },
      {
        type: 'bytes',
        name: '_userIntentSignature',
      },
      {
        type: 'bytes',
        name: '_feeVerificationSignature',
      },
      {
        type: 'uint256',
        name: '_bridgeFeeDeadline',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'tuple',
        name: '_tokenDepositDetails',
        components: [
          {
            type: 'tuple[]',
            name: 'permitted',
            components: [
              {
                type: 'address',
                name: 'token',
              },
              {
                type: 'uint256',
                name: 'amount',
              },
            ],
          },
          {
            type: 'uint256',
            name: 'nonce',
          },
          {
            type: 'uint256',
            name: 'deadline',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_executorFeeInfo',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
          {
            type: 'bool',
            name: 'updateBridgeInAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_adapterInfo',
        components: [
          {
            type: 'address',
            name: 'adapter',
          },
          {
            type: 'bytes',
            name: 'adapterData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeMultiSwap',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_userIntentSignature',
      },
      {
        type: 'uint256',
        name: '_userIntentDeadline',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'tuple[]',
        name: '_inputTokens',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_executorFeeInfo',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeMultiSwapWithPermit2Witness',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_userIntentSignature',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'tuple',
        name: '_tokenDepositDetails',
        components: [
          {
            type: 'tuple[]',
            name: 'permitted',
            components: [
              {
                type: 'address',
                name: 'token',
              },
              {
                type: 'uint256',
                name: 'amount',
              },
            ],
          },
          {
            type: 'uint256',
            name: 'nonce',
          },
          {
            type: 'uint256',
            name: 'deadline',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_executorFeeInfo',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeSwap',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_userIntentSignature',
      },
      {
        type: 'bytes',
        name: '_tokenApprovalData',
      },
      {
        type: 'uint256',
        name: '_userIntentDeadline',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'tuple',
        name: '_executorFeeInfo',
        components: [
          {
            type: 'address',
            name: 'token',
          },
          {
            type: 'uint256',
            name: 'amount',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'recipient',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'address',
            name: 'to',
          },
          {
            type: 'uint256',
            name: 'fromAmount',
          },
          {
            type: 'uint256',
            name: 'minToAmount',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_swapExecutionData',
        components: [
          {
            type: 'string',
            name: 'dex',
          },
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bool',
            name: 'isDirectTransfer',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'CannotBridgeToSameNetwork',
    inputs: [],
  },
  {
    type: 'error',
    name: 'Erc20CallFailed',
    inputs: [
      {
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'error',
    name: 'InvalidEncodedAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NativeCallFailed',
    inputs: [
      {
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'error',
    name: 'NoBridgeFromZeroAmount',
    inputs: [],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'RelayBridgeTransferStarted',
    inputs: [
      {
        type: 'bytes',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'user',
        indexed: true,
      },
      {
        type: 'bytes',
        name: 'reciever',
        indexed: false,
      },
      {
        type: 'address',
        name: 'from',
        indexed: false,
      },
      {
        type: 'bytes',
        name: 'to',
        indexed: false,
      },
      {
        type: 'tuple',
        name: 'relayData',
        indexed: false,
        components: [
          {
            type: 'uint256',
            name: 'amountIn',
          },
          {
            type: 'bytes32',
            name: 'requestId',
          },
        ],
      },
      {
        type: 'uint256',
        name: 'destinationChainId',
        indexed: false,
      },
      {
        type: 'bool',
        name: 'hasDestinationCall',
        indexed: false,
      },
    ],
  },
  {
    type: 'function',
    name: '_RELAY_RECEIVER',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: '_RELAY_SOLVER',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: '',
      },
    ],
  },
  {
    type: 'function',
    name: 'bridgeViaRelay',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bool',
        name: '_updateAmountIn',
      },
      {
        type: 'address',
        name: '_from',
      },
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_receiver',
      },
      {
        type: 'bytes',
        name: '_to',
      },
      {
        type: 'tuple',
        name: '_relayData',
        components: [
          {
            type: 'uint256',
            name: 'amountIn',
          },
          {
            type: 'bytes32',
            name: 'requestId',
          },
        ],
      },
      {
        type: 'uint256',
        name: '_destinationChainId',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'bool',
        name: '_hasDestinationCall',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getRelayAddress',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: 'receiver',
      },
      {
        type: 'address',
        name: 'solver',
      },
    ],
  },
  {
    type: 'error',
    name: 'BridgeCallFailed',
    inputs: [
      {
        type: 'address',
        name: 'target',
      },
      {
        type: 'bytes4',
        name: 'funSig',
      },
      {
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'function',
    name: 'bridgeViaGeneric',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bool',
        name: '_updateAmountIn',
      },
      {
        type: 'address',
        name: '_from',
      },
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_callData',
      },
      {
        type: 'bytes',
        name: '_receiver',
      },
      {
        type: 'bytes',
        name: '_to',
      },
      {
        type: 'string',
        name: '_bridge',
      },
      {
        type: 'uint256',
        name: '_amountIn',
      },
      {
        type: 'uint256',
        name: '_offset',
      },
      {
        type: 'uint256',
        name: '_extraNative',
      },
      {
        type: 'uint256',
        name: '_destinationChainId',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'address',
        name: '_callTo',
      },
      {
        type: 'address',
        name: '_approveTo',
      },
      {
        type: 'bool',
        name: '_hasDestinationCall',
      },
    ],
    outputs: [],
  },
  {
    type: 'error',
    name: 'TransferAmountMismatch',
    inputs: [],
  },
  {
    type: 'function',
    name: 'bridgeViaTransfer',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bool',
        name: '_updateAmountIn',
      },
      {
        type: 'address',
        name: '_from',
      },
      {
        type: 'bytes',
        name: '_transactionId',
      },
      {
        type: 'bytes',
        name: '_receiver',
      },
      {
        type: 'bytes',
        name: '_to',
      },
      {
        type: 'string',
        name: '_bridge',
      },
      {
        type: 'uint256',
        name: '_amountIn',
      },
      {
        type: 'uint256',
        name: '_destinationChainId',
      },
      {
        type: 'address',
        name: '_user',
      },
      {
        type: 'address',
        name: '_transferTo',
      },
      {
        type: 'bool',
        name: '_hasDestinationCall',
      },
    ],
    outputs: [],
  },
] as unknown as Abi;
