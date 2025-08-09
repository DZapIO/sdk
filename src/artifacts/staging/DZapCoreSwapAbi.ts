import { Abi } from 'viem';

export const abi: Abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_relayReceiver',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_relaySolver',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    type: 'error',
    name: 'CannotAuthorizeSelf',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OnlyContractOwner',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BridgeCallFailed',
    inputs: [
      {
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'error',
    name: 'CannotBridgeToSameNetwork',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InformationMismatch',
    inputs: [],
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
    name: 'IntegratorNotAllowed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidLength',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermit',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermitData',
    inputs: [],
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
    name: 'NotAContract',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAValidSpender',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAnERC20Token',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UnAuthorizedCall',
    inputs: [
      {
        type: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'CannotBridgeToSameNetwork',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InformationMismatch',
    inputs: [],
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
    name: 'IntegratorNotAllowed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidLength',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermit',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermitData',
    inputs: [],
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
    name: 'NullAddrIsNotAnERC20Token',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BridgeNotAdded',
    inputs: [
      {
        type: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'CannotAuthorizeSelf',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UnAuthorized',
    inputs: [],
  },
  {
    type: 'error',
    name: 'BridgeCallFailed',
    inputs: [
      {
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'error',
    name: 'CannotBridgeToSameNetwork',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ContractCallNotAllowed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InformationMismatch',
    inputs: [],
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
    name: 'IntegratorNotAllowed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidContract',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidLength',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermit',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermitData',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidSwapDetails',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NativeTransferFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoSwapFromZeroBalance',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoTransferToNullAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NotAContract',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAValidSpender',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAnERC20Token',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SlippageTooLow',
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
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'error',
    name: 'UnAuthorizedCall',
    inputs: [
      {
        type: 'address',
      },
    ],
  },
  {
    type: 'error',
    name: 'CannotAuthorizeSelf',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidContract',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UnAuthorized',
    inputs: [],
  },
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
    name: 'OnlyContractOwner',
    inputs: [],
  },
  {
    type: 'error',
    name: 'AlreadyInitialized',
    inputs: [],
  },
  {
    type: 'error',
    name: 'FeeTooHigh',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidFee',
    inputs: [],
  },
  {
    type: 'error',
    name: 'OnlyContractOwner',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ZeroAddress',
    inputs: [],
  },
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
    name: 'FeeTooHigh',
    inputs: [],
  },
  {
    type: 'error',
    name: 'IntegratorNotActive',
    inputs: [],
  },
  {
    type: 'error',
    name: 'IntegratorNotAllowed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ShareTooHigh',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UnAuthorized',
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
    type: 'error',
    name: 'AllSwapsFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ContractCallNotAllowed',
    inputs: [],
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
    name: 'IntegratorNotAllowed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidAmount',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidContract',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermit',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InvalidPermitData',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NativeTransferFailed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoSwapFromZeroBalance',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NoTransferToNullAddress',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAValidSpender',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAnERC20Token',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SlippageTooLow',
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
        type: 'bytes',
        name: 'reason',
      },
    ],
  },
  {
    type: 'error',
    name: 'ZeroAddress',
    inputs: [],
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
    name: 'NotAContract',
    inputs: [],
  },
  {
    type: 'error',
    name: 'NullAddrIsNotAnERC20Token',
    inputs: [],
  },
  {
    type: 'error',
    name: 'ReentrancyError',
    inputs: [],
  },
  {
    type: 'error',
    name: 'UnAuthorized',
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
    name: 'DexAdded',
    inputs: [
      {
        type: 'address',
        name: 'dexAddress',
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
        name: 'dexAddress',
        indexed: true,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'FunctionSignatureApprovalChanged',
    inputs: [
      {
        type: 'address',
        name: 'dex',
        indexed: true,
      },
      {
        type: 'bytes4',
        name: 'functionSignature',
        indexed: true,
      },
      {
        type: 'bool',
        name: 'approved',
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
        indexed: false,
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
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BridgeAdded',
    inputs: [
      {
        type: 'address[]',
        name: 'bridges',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BridgeRemoved',
    inputs: [
      {
        type: 'address[]',
        name: 'bridges',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SelectorToInfoUpdated',
    inputs: [
      {
        type: 'address[]',
        name: 'bridges',
        indexed: false,
      },
      {
        type: 'bytes4[]',
        name: 'selectors',
        indexed: false,
      },
      {
        type: 'uint256[]',
        name: 'info',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SetDzapFixedNativeFeeAmount',
    inputs: [
      {
        type: 'uint256',
        name: 'fee',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SetDzapTokenFee',
    inputs: [
      {
        type: 'uint256',
        name: 'fee',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SetFixedNativeFee',
    inputs: [
      {
        type: 'uint256',
        name: 'fee',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SetIntegrator',
    inputs: [
      {
        type: 'address',
        name: 'integrator',
        indexed: false,
      },
      {
        type: 'uint8[]',
        name: 'feeType',
        indexed: false,
      },
      {
        type: 'tuple[]',
        name: 'info',
        indexed: false,
        components: [
          {
            type: 'uint256',
            name: 'tokenFee',
          },
          {
            type: 'uint256',
            name: 'fixedNativeFeeAmount',
          },
          {
            type: 'uint256',
            name: 'dzapTokenShare',
          },
          {
            type: 'uint256',
            name: 'dzapFixedNativeShare',
          },
        ],
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SetMaxPlatformFee',
    inputs: [
      {
        type: 'uint256',
        name: 'fee',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SetPlatformFee',
    inputs: [
      {
        type: 'uint256',
        name: 'fee',
        indexed: false,
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'MultiSwapped',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'address',
        name: 'recipient',
        indexed: false,
      },
      {
        type: 'tuple[]',
        name: 'swapInfo',
        indexed: false,
        components: [
          {
            type: 'address',
            name: 'dex',
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
            name: 'leftOverFromAmount',
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
    name: 'Swapped',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'address',
        name: 'recipient',
        indexed: false,
      },
      {
        type: 'tuple',
        name: 'swapInfo',
        indexed: false,
        components: [
          {
            type: 'address',
            name: 'dex',
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
            name: 'leftOverFromAmount',
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
    name: 'SwappedSingleToken',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'address',
        name: 'recipient',
        indexed: false,
      },
      {
        type: 'tuple',
        name: 'swapInfo',
        indexed: false,
        components: [
          {
            type: 'address',
            name: 'dex',
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
            name: 'leftOverFromAmount',
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
    name: 'BridgeTransferStarted',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple',
        name: 'bridgeData',
        indexed: false,
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'MultiTokenBridgeTransferStarted',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple[]',
        name: 'bridgeData',
        indexed: false,
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'SwapBridgeTransferStarted',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple[]',
        name: 'bridgeData',
        indexed: false,
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: 'swapInfo',
        indexed: false,
        components: [
          {
            type: 'address',
            name: 'dex',
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
            name: 'leftOverFromAmount',
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
    name: 'BatchBridgeTransferStart',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple[]',
        name: 'bridgeData',
        indexed: false,
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'BatchSwapAndBridgeTransferStart',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple[]',
        name: 'bridgeData',
        indexed: false,
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: 'swapInfo',
        indexed: false,
        components: [
          {
            type: 'address',
            name: 'dex',
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
            name: 'leftOverFromAmount',
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
    name: 'GasZipBridgeTransferStarted',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple',
        name: 'gasZipData',
        indexed: false,
        components: [
          {
            type: 'bytes32',
            name: 'recipient',
          },
          {
            type: 'uint256',
            name: 'destChains',
          },
          {
            type: 'uint256',
            name: 'depositAmount',
          },
        ],
      },
    ],
  },
  {
    type: 'event',
    anonymous: false,
    name: 'GasZipSwapBridgeTransferStarted',
    inputs: [
      {
        type: 'bytes32',
        name: 'transactionId',
        indexed: true,
      },
      {
        type: 'address',
        name: 'integrator',
        indexed: true,
      },
      {
        type: 'address',
        name: 'sender',
        indexed: true,
      },
      {
        type: 'tuple',
        name: 'gasZipData',
        indexed: false,
        components: [
          {
            type: 'bytes32',
            name: 'recipient',
          },
          {
            type: 'uint256',
            name: 'destChains',
          },
          {
            type: 'uint256',
            name: 'depositAmount',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: 'swapInfo',
        indexed: false,
        components: [
          {
            type: 'address',
            name: 'dex',
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
            name: 'leftOverFromAmount',
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
    type: 'function',
    name: 'addAggregatorsAndBridges',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_bridgeAddresses',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getSelectorInfo',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_bridge',
      },
      {
        type: 'bytes4',
        name: '_selector',
      },
    ],
    outputs: [
      {
        type: 'bool',
      },
      {
        type: 'uint256',
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
      },
    ],
  },
  {
    type: 'function',
    name: 'removeAggregatorsAndBridges',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_bridgeAddresses',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'updateSelectorInfo',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_bridgeAddresses',
      },
      {
        type: 'bytes4[]',
        name: '_selectors',
      },
      {
        type: 'uint256[]',
        name: '_offset',
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
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'tuple',
        name: '_bridgeData',
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_genericData',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'uint256',
            name: 'extraNative',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
          {
            type: 'bytes',
            name: 'callData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'bridgeMultipleTokens',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'tuple[]',
        name: '_bridgeData',
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_genericData',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'uint256',
            name: 'extraNative',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
          {
            type: 'bytes',
            name: 'callData',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'swapAndBridge',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'tuple[]',
        name: '_bridgeData',
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_swapData',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
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
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_genericData',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
          },
          {
            type: 'uint256',
            name: 'extraNative',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
          {
            type: 'bytes',
            name: 'callData',
          },
        ],
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
    name: 'batchAddDex',
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
    name: 'batchRemoveDex',
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
    name: 'batchSetFunctionApprovalBySignature',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address[]',
        name: '_dexs',
      },
      {
        type: 'bytes4[]',
        name: '_signatures',
      },
      {
        type: 'bool[]',
        name: '_approval',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isContractApproved',
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
        name: 'approved',
      },
    ],
  },
  {
    type: 'function',
    name: 'isFunctionApproved',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_dex',
      },
      {
        type: 'bytes4',
        name: '_signature',
      },
    ],
    outputs: [
      {
        type: 'bool',
        name: 'approved',
      },
    ],
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
    name: 'setFunctionApprovalBySignature',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_dex',
      },
      {
        type: 'bytes4',
        name: '_signature',
      },
      {
        type: 'bool',
        name: '_approval',
      },
    ],
    outputs: [],
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
    type: 'function',
    name: 'initialize',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_permit2',
      },
      {
        type: 'address',
        name: '_protocolFeeVault',
      },
      {
        type: 'uint256',
        name: '_maxTokenFee',
      },
      {
        type: 'uint256',
        name: '_maxFixedNativeFeeAmount',
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
      },
    ],
  },
  {
    type: 'constructor',
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'address',
        name: '_contractOwner',
      },
      {
        type: 'address',
        name: '_diamondCutFacet',
      },
    ],
  },
  {
    type: 'function',
    name: 'calcFixedNativeFees',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'uint8',
        name: '_feeType',
      },
    ],
    outputs: [
      {
        type: 'uint256',
        name: 'fixedNativeFeeAmount',
      },
      {
        type: 'uint256',
        name: 'dzapShare',
      },
    ],
  },
  {
    type: 'function',
    name: 'calcTokenFees',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'uint8',
        name: '_feeType',
      },
      {
        type: 'uint256',
        name: '_amount',
      },
    ],
    outputs: [
      {
        type: 'uint256',
        name: 'totalFee',
      },
      {
        type: 'uint256',
        name: 'dzapShare',
      },
    ],
  },
  {
    type: 'function',
    name: 'integratorFeeInfo',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'uint8',
        name: '_feeType',
      },
    ],
    outputs: [
      {
        type: 'tuple',
        components: [
          {
            type: 'uint256',
            name: 'tokenFee',
          },
          {
            type: 'uint256',
            name: 'fixedNativeFeeAmount',
          },
          {
            type: 'uint256',
            name: 'dzapTokenShare',
          },
          {
            type: 'uint256',
            name: 'dzapFixedNativeShare',
          },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'isIntegratorAllowed',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_integrator',
      },
    ],
    outputs: [
      {
        type: 'bool',
      },
    ],
  },
  {
    type: 'function',
    name: 'maxFixedNativeFeeAmount',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'uint256',
        name: '_maxFixedNativeFee',
      },
    ],
  },
  {
    type: 'function',
    name: 'maxTokenFee',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'protocolFeeVault',
    constant: true,
    stateMutability: 'view',
    payable: false,
    inputs: [],
    outputs: [
      {
        type: 'address',
      },
    ],
  },
  {
    type: 'function',
    name: 'removeIntegrator',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_integrator',
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'setIntegratorInfo',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'uint8[]',
        name: '_feeTypes',
      },
      {
        type: 'tuple[]',
        name: '_feeInfo',
        components: [
          {
            type: 'uint256',
            name: 'tokenFee',
          },
          {
            type: 'uint256',
            name: 'fixedNativeFeeAmount',
          },
          {
            type: 'uint256',
            name: 'dzapTokenShare',
          },
          {
            type: 'uint256',
            name: 'dzapFixedNativeShare',
          },
        ],
      },
    ],
    outputs: [],
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
    type: 'function',
    name: 'multiSwap',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'address',
        name: '_recipient',
      },
      {
        type: 'tuple[]',
        name: '_data',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
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
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'multiSwapWithoutRevert',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'address',
        name: '_recipient',
      },
      {
        type: 'tuple[]',
        name: '_data',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
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
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
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
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'address',
        name: '_recipient',
      },
      {
        type: 'tuple',
        name: '_data',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
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
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'swapErc20ToErc20',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_recipient',
      },
      {
        type: 'tuple',
        name: '_data',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
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
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'swapErc20ToNative',
    constant: false,
    payable: false,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_recipient',
      },
      {
        type: 'tuple',
        name: '_data',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
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
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'swapNativeToErc20',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_recipient',
      },
      {
        type: 'tuple',
        name: '_data',
        components: [
          {
            type: 'address',
            name: 'callTo',
          },
          {
            type: 'address',
            name: 'approveTo',
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
            type: 'bytes',
            name: 'swapCallData',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
    ],
    outputs: [],
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
    type: 'function',
    name: 'bridgeMultipleTokensViaTransfer',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'tuple[]',
        name: '_bridgeData',
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
      {
        type: 'tuple[]',
        name: '_transferData',
        components: [
          {
            type: 'address',
            name: 'transferTo',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'bridgeViaTransfer',
    constant: false,
    stateMutability: 'payable',
    payable: true,
    inputs: [
      {
        type: 'bytes32',
        name: '_transactionId',
      },
      {
        type: 'address',
        name: '_integrator',
      },
      {
        type: 'tuple',
        name: '_bridgeData',
        components: [
          {
            type: 'string',
            name: 'bridge',
          },
          {
            type: 'bytes',
            name: 'to',
          },
          {
            type: 'bytes',
            name: 'receiver',
          },
          {
            type: 'address',
            name: 'from',
          },
          {
            type: 'bool',
            name: 'hasSourceSwaps',
          },
          {
            type: 'bool',
            name: 'hasDestinationCall',
          },
          {
            type: 'uint256',
            name: 'minAmountIn',
          },
          {
            type: 'uint256',
            name: 'destinationChainId',
          },
        ],
      },
      {
        type: 'tuple',
        name: '_transferData',
        components: [
          {
            type: 'address',
            name: 'transferTo',
          },
          {
            type: 'bytes',
            name: 'permit',
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_recipient',
        type: 'address',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_data',
        type: 'tuple[]',
      },
    ],
    name: 'multiSwapAndTransfer',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_recipient',
        type: 'address',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_data',
        type: 'tuple[]',
      },
    ],
    name: 'multiSwapAndTransferWithoutRevert',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_recipient',
        type: 'address',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData',
        name: '_data',
        type: 'tuple',
      },
    ],
    name: 'swapAndTransfer',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_recipient',
        type: 'address',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_data',
        type: 'tuple[]',
      },
      {
        internalType: 'bool[]',
        name: '_isDirectTransfer',
        type: 'bool[]',
      },
    ],
    name: 'batchSwap',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'bridge',
            type: 'string',
          },
          {
            internalType: 'bytes',
            name: 'to',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'receiver',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'hasSourceSwaps',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'hasDestinationCall',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'minAmountIn',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
        ],
        internalType: 'struct GenericBridgeData[]',
        name: '_bridgeData',
        type: 'tuple[]',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_swapData',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'transferTo',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct TransferData[]',
        name: '_transferData',
        type: 'tuple[]',
      },
    ],
    name: 'swapAndBridgeViaTransfer',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'recipeint',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'destChains',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'depositAmount',
            type: 'uint256',
          },
        ],
        internalType: 'struct GasZipData',
        name: '_gasZipData',
        type: 'tuple',
      },
    ],
    name: 'bridgeTokensViaGasZip',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGasZipRouter',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getGasZipRouter',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_swapData',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'recipeint',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'destChains',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'depositAmount',
            type: 'uint256',
          },
        ],
        internalType: 'struct GasZipData',
        name: '_gasZipData',
        type: 'tuple',
      },
    ],
    name: 'swapAndBridgeTokensViaGasZip',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'RELAY_RECIEVER',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'RELAY_SOLVER',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'bridge',
            type: 'string',
          },
          {
            internalType: 'bytes',
            name: 'to',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'receiver',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'hasSourceSwaps',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'hasDestinationCall',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'minAmountIn',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
        ],
        internalType: 'struct GenericBridgeData[]',
        name: '_bridgeData',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'requestId',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct RelayData[]',
        name: '_relayData',
        type: 'tuple[]',
      },
    ],
    name: 'bridgeMultipleTokensViaRelay',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'bridge',
            type: 'string',
          },
          {
            internalType: 'bytes',
            name: 'to',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'receiver',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'hasSourceSwaps',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'hasDestinationCall',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'minAmountIn',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
        ],
        internalType: 'struct GenericBridgeData',
        name: '_bridgeData',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'requestId',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct RelayData',
        name: '_relayData',
        type: 'tuple',
      },
    ],
    name: 'bridgeViaRelay',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRelayAddress',
    outputs: [
      {
        internalType: 'address',
        name: 'reciever',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'solver',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'bridge',
            type: 'string',
          },
          {
            internalType: 'bytes',
            name: 'to',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'receiver',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'hasSourceSwaps',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'hasDestinationCall',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'minAmountIn',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
        ],
        internalType: 'struct GenericBridgeData[]',
        name: '_bridgeData',
        type: 'tuple[]',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_swapData',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'requestId',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct RelayData[]',
        name: '_relayData',
        type: 'tuple[]',
      },
    ],
    name: 'swapAndBridgeViaRelay',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_srcToken',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
    ],
    name: 'bridge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'bridge',
            type: 'string',
          },
          {
            internalType: 'bytes',
            name: 'to',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'receiver',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'hasSourceSwaps',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'hasDestinationCall',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'minAmountIn',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
        ],
        internalType: 'struct GenericBridgeData[]',
        name: '_bridgeData',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'adapter',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct AdapterData[]',
        name: '_data',
        type: 'tuple[]',
      },
    ],
    name: 'batchBridge',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_transactionId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_integrator',
        type: 'address',
      },
      {
        components: [
          {
            internalType: 'string',
            name: 'bridge',
            type: 'string',
          },
          {
            internalType: 'bytes',
            name: 'to',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'receiver',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'bool',
            name: 'hasSourceSwaps',
            type: 'bool',
          },
          {
            internalType: 'bool',
            name: 'hasDestinationCall',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'minAmountIn',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'destinationChainId',
            type: 'uint256',
          },
        ],
        internalType: 'struct GenericBridgeData[]',
        name: '_bridgeData',
        type: 'tuple[]',
      },
      {
        components: [
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
          {
            internalType: 'bytes',
            name: 'swapCallData',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct SwapData[]',
        name: '_swapData',
        type: 'tuple[]',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'adapter',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'permit',
            type: 'bytes',
          },
        ],
        internalType: 'struct AdapterData[]',
        name: '_data',
        type: 'tuple[]',
      },
    ],
    name: 'batchSwapAndBridge',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as unknown as Abi;
