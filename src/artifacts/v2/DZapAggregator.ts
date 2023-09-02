export const abi = [
  {
    inputs: [],
    name: "AllSwapsFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "ContractCallNotAllowed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "contractBalance",
        type: "uint256",
      },
    ],
    name: "InsufficientBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "IntegratorNotAllowed",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "minAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "returnAmount",
        type: "uint256",
      },
    ],
    name: "InvalidMinAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "NativeTransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "NoSwapFromZeroBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "NoTransferToNullAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "NullAddrIsNotAValidSpender",
    type: "error",
  },
  {
    inputs: [],
    name: "NullAddrIsNotAnERC20Token",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyError",
    type: "error",
  },
  {
    inputs: [],
    name: "SliceOutOfBounds",
    type: "error",
  },
  {
    inputs: [],
    name: "SliceOverflow",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "SwapCallFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAddress",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "integrator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fixedNativeFee",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "dex",
            type: "address",
          },
          {
            internalType: "address",
            name: "fromToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "toToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "leftOverFromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "returnToAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalFee",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct SwapInfo[]",
        name: "swapInfo",
        type: "tuple[]",
      },
    ],
    name: "MultiSwapped",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "integrator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fixedNativeFee",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "dex",
            type: "address",
          },
          {
            internalType: "address",
            name: "fromToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "toToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "leftOverFromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "returnToAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalFee",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct SwapInfo",
        name: "swapInfo",
        type: "tuple",
      },
    ],
    name: "Swapped",
    type: "event",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "callTo",
            type: "address",
          },
          {
            internalType: "address",
            name: "approveTo",
            type: "address",
          },
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minToAmount",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "swapCallData",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "permit",
            type: "bytes",
          },
        ],
        internalType: "struct SwapData[]",
        name: "_data",
        type: "tuple[]",
      },
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "address",
        name: "_integrator",
        type: "address",
      },
    ],
    name: "multiSwap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "callTo",
            type: "address",
          },
          {
            internalType: "address",
            name: "approveTo",
            type: "address",
          },
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minToAmount",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "swapCallData",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "permit",
            type: "bytes",
          },
        ],
        internalType: "struct SwapData[]",
        name: "_data",
        type: "tuple[]",
      },
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "address",
        name: "_integrator",
        type: "address",
      },
    ],
    name: "multiSwapWithoutRevert",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "callTo",
            type: "address",
          },
          {
            internalType: "address",
            name: "approveTo",
            type: "address",
          },
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "fromAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minToAmount",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "swapCallData",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "permit",
            type: "bytes",
          },
        ],
        internalType: "struct SwapData",
        name: "_data",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "address",
        name: "_integrator",
        type: "address",
      },
    ],
    name: "swap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];
