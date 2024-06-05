export const abi = {
  _format: 'hh-sol-artifact-1',
  contractName: 'Permit2',
  sourceName: 'contracts/mock/Permi2Mock.sol',
  abi: [
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'deadline',
          type: 'uint256',
        },
      ],
      name: 'AllowanceExpired',
      type: 'error',
    },
    {
      inputs: [],
      name: 'ExcessiveInvalidation',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'InsufficientAllowance',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'maxAmount',
          type: 'uint256',
        },
      ],
      name: 'InvalidAmount',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidContractSignature',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidNonce',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidSignature',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidSignatureLength',
      type: 'error',
    },
    {
      inputs: [],
      name: 'InvalidSigner',
      type: 'error',
    },
    {
      inputs: [],
      name: 'LengthMismatch',
      type: 'error',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'signatureDeadline',
          type: 'uint256',
        },
      ],
      name: 'SignatureExpired',
      type: 'error',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint160',
          name: 'amount',
          type: 'uint160',
        },
        {
          indexed: false,
          internalType: 'uint48',
          name: 'expiration',
          type: 'uint48',
        },
      ],
      name: 'Approval',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
      ],
      name: 'Lockdown',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint48',
          name: 'newNonce',
          type: 'uint48',
        },
        {
          indexed: false,
          internalType: 'uint48',
          name: 'oldNonce',
          type: 'uint48',
        },
      ],
      name: 'NonceInvalidation',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint160',
          name: 'amount',
          type: 'uint160',
        },
        {
          indexed: false,
          internalType: 'uint48',
          name: 'expiration',
          type: 'uint48',
        },
        {
          indexed: false,
          internalType: 'uint48',
          name: 'nonce',
          type: 'uint48',
        },
      ],
      name: 'Permit',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'word',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'mask',
          type: 'uint256',
        },
      ],
      name: 'UnorderedNonceInvalidation',
      type: 'event',
    },
    {
      inputs: [],
      name: 'DOMAIN_SEPARATOR',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'allowance',
      outputs: [
        {
          internalType: 'uint160',
          name: 'amount',
          type: 'uint160',
        },
        {
          internalType: 'uint48',
          name: 'expiration',
          type: 'uint48',
        },
        {
          internalType: 'uint48',
          name: 'nonce',
          type: 'uint48',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          internalType: 'uint160',
          name: 'amount',
          type: 'uint160',
        },
        {
          internalType: 'uint48',
          name: 'expiration',
          type: 'uint48',
        },
      ],
      name: 'approve',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          internalType: 'uint48',
          name: 'newNonce',
          type: 'uint48',
        },
      ],
      name: 'invalidateNonces',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'wordPos',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'mask',
          type: 'uint256',
        },
      ],
      name: 'invalidateUnorderedNonces',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'token',
              type: 'address',
            },
            {
              internalType: 'address',
              name: 'spender',
              type: 'address',
            },
          ],
          internalType: 'struct IAllowanceTransfer.TokenSpenderPair[]',
          name: 'approvals',
          type: 'tuple[]',
        },
      ],
      name: 'lockdown',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'nonceBitmap',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
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
                  internalType: 'uint160',
                  name: 'amount',
                  type: 'uint160',
                },
                {
                  internalType: 'uint48',
                  name: 'expiration',
                  type: 'uint48',
                },
                {
                  internalType: 'uint48',
                  name: 'nonce',
                  type: 'uint48',
                },
              ],
              internalType: 'struct IAllowanceTransfer.PermitDetails[]',
              name: 'details',
              type: 'tuple[]',
            },
            {
              internalType: 'address',
              name: 'spender',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'sigDeadline',
              type: 'uint256',
            },
          ],
          internalType: 'struct IAllowanceTransfer.PermitBatch',
          name: 'permitBatch',
          type: 'tuple',
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes',
        },
      ],
      name: 'permit',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
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
                  internalType: 'uint160',
                  name: 'amount',
                  type: 'uint160',
                },
                {
                  internalType: 'uint48',
                  name: 'expiration',
                  type: 'uint48',
                },
                {
                  internalType: 'uint48',
                  name: 'nonce',
                  type: 'uint48',
                },
              ],
              internalType: 'struct IAllowanceTransfer.PermitDetails',
              name: 'details',
              type: 'tuple',
            },
            {
              internalType: 'address',
              name: 'spender',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'sigDeadline',
              type: 'uint256',
            },
          ],
          internalType: 'struct IAllowanceTransfer.PermitSingle',
          name: 'permitSingle',
          type: 'tuple',
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes',
        },
      ],
      name: 'permit',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
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
              internalType: 'struct ISignatureTransfer.TokenPermissions',
              name: 'permitted',
              type: 'tuple',
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
          internalType: 'struct ISignatureTransfer.PermitTransferFrom',
          name: 'permit',
          type: 'tuple',
        },
        {
          components: [
            {
              internalType: 'address',
              name: 'to',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'requestedAmount',
              type: 'uint256',
            },
          ],
          internalType: 'struct ISignatureTransfer.SignatureTransferDetails',
          name: 'transferDetails',
          type: 'tuple',
        },
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes',
        },
      ],
      name: 'permitTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
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
              internalType: 'struct ISignatureTransfer.TokenPermissions[]',
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
          internalType: 'struct ISignatureTransfer.PermitBatchTransferFrom',
          name: 'permit',
          type: 'tuple',
        },
        {
          components: [
            {
              internalType: 'address',
              name: 'to',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'requestedAmount',
              type: 'uint256',
            },
          ],
          internalType: 'struct ISignatureTransfer.SignatureTransferDetails[]',
          name: 'transferDetails',
          type: 'tuple[]',
        },
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes',
        },
      ],
      name: 'permitTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
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
              internalType: 'struct ISignatureTransfer.TokenPermissions',
              name: 'permitted',
              type: 'tuple',
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
          internalType: 'struct ISignatureTransfer.PermitTransferFrom',
          name: 'permit',
          type: 'tuple',
        },
        {
          components: [
            {
              internalType: 'address',
              name: 'to',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'requestedAmount',
              type: 'uint256',
            },
          ],
          internalType: 'struct ISignatureTransfer.SignatureTransferDetails',
          name: 'transferDetails',
          type: 'tuple',
        },
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'bytes32',
          name: 'witness',
          type: 'bytes32',
        },
        {
          internalType: 'string',
          name: 'witnessTypeString',
          type: 'string',
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes',
        },
      ],
      name: 'permitWitnessTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
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
              internalType: 'struct ISignatureTransfer.TokenPermissions[]',
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
          internalType: 'struct ISignatureTransfer.PermitBatchTransferFrom',
          name: 'permit',
          type: 'tuple',
        },
        {
          components: [
            {
              internalType: 'address',
              name: 'to',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'requestedAmount',
              type: 'uint256',
            },
          ],
          internalType: 'struct ISignatureTransfer.SignatureTransferDetails[]',
          name: 'transferDetails',
          type: 'tuple[]',
        },
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'bytes32',
          name: 'witness',
          type: 'bytes32',
        },
        {
          internalType: 'string',
          name: 'witnessTypeString',
          type: 'string',
        },
        {
          internalType: 'bytes',
          name: 'signature',
          type: 'bytes',
        },
      ],
      name: 'permitWitnessTransferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          components: [
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
              internalType: 'uint160',
              name: 'amount',
              type: 'uint160',
            },
            {
              internalType: 'address',
              name: 'token',
              type: 'address',
            },
          ],
          internalType: 'struct IAllowanceTransfer.AllowanceTransferDetails[]',
          name: 'transferDetails',
          type: 'tuple[]',
        },
      ],
      name: 'transferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
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
          internalType: 'uint160',
          name: 'amount',
          type: 'uint160',
        },
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
      ],
      name: 'transferFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
  bytecode:
    '0x60c0346100bb574660a052602081017f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a86681527f9ac997416e8ff9d2ff6bebeb7149f65cdae5e32e2b90440b566bb3044041d36a60408301524660608301523060808301526080825260a082019180831060018060401b038411176100a55782604052519020608052611b7590816100c1823960805181611297015260a051816112710152f35b634e487b7160e01b600052604160045260246000fd5b600080fdfe6040608081526004908136101561001557600080fd5b600090813560e01c80630d58b1db14610e8e578063137c29fe14610d0d5780632a2d80d114610aab5780632b67b5701461093557806330f28b7a146108795780633644e5151461085657806336c785161461080b5780633ff9dcb1146107aa5780634fe02b441461076b57806365d9723c1461066457806387517c4514610587578063927da105146104fb578063cc53287f1461041b578063edd9444b146102f05763fe8ec1a7146100c657600080fd5b346102ec5760c03660031901126102ec576001600160401b0383358181116102e8576100f59036908601611175565b906024358181116102e45761010d9036908701611145565b610118939193611059565b906084358481116102e0576101309036908a016110ee565b98909460a4359081116102dc57610149913691016110ee565b95909487519061015882610fbb565b606b82527f5065726d697442617463685769746e6573735472616e7366657246726f6d285460208301527f6f6b656e5065726d697373696f6e735b5d207065726d69747465642c61646472898301527f657373207370656e6465722c75696e74323536206e6f6e63652c75696e74323560608301526a0d88191958591b1a5b994b60aa1b608083015288519a8b91816101f5602085018096611938565b918237018a81520399610210601f199b8c8101835282610ff1565b51902084515161021f8161160c565b908a5b8181106102af575050976102a3819a9b6102ac9a83516102568161024a60208201809561164d565b03848101835282610ff1565b519020602089810151858b015195519182019687526040820192909252336060820152608081019190915260a081019390935260643560c08401528260e081015b03908101835282610ff1565b519020936119f6565b51f35b806102c76102c16102d7938b516115f8565b516118e9565b6102d182866115f8565b5261163e565b610222565b8880fd5b8780fd5b8480fd5b8380fd5b5080fd5b50346102ec5760803660031901126102ec576001600160401b0383358181116102e8576103209036908601611175565b6024358281116102e4576103379036908701611145565b919095610342611059565b9360643590811161041757610359913691016110ee565b939092825151976103698961160c565b98885b8181106103f55750508697986102ac975161039d8161038f60208201809561164d565b03601f198101835282610ff1565b5190206020850151898601518a519160208301937ffcf35f5ac6a2c28868dc44c302166470266239195f02b0ee408334829333b76685528c840152336060840152608083015260a082015260a081526102a381610fd6565b808b6102d18261040c6102c1610412968c516115f8565b926115f8565b61036c565b8680fd5b5082346104f757602090816003193601126102e8578035906001600160401b0382116102e45761044d91369101611145565b91845b83811061045c57858551f35b8061047261046d60019387876117ba565b6117ca565b610487846104818489896117ba565b016117ca565b33895283855287892091848060a01b0380911692838b528652888a20911690818a5285528789206bffffffffffffffffffffffff60a01b81541690558751918252848201527f89b1add15eff56b3dfe299ad94e01f2b52fbcb80ae1a3baea6ae8c04cb2b98a4873392a201610450565b8280fd5b50346102ec5760603660031901126102ec576105838161051961102d565b93610522611043565b61052a611059565b6001600160a01b03968716835260016020908152848420928816845291825283832090871683528152919020549251938316845260a083901c65ffffffffffff169084015260d09190911c604083015281906060820190565b0390f35b50346102ec5760803660031901126102ec576105a161102d565b6105a9611043565b906105b2611059565b65ffffffffffff91606435838116918282036102e05733885260016020528688209460018060a01b0380921695868a5260205281888a20971696878a5260205287892092841560001461065c57504216905b8254941693849165ffffffffffff60a01b9060a01b169065ffffffffffff60d01b1617179055845191825260208201527fda9fa7c1b00402c17d0161b249b1ab8bbec047c5a52207b9c112deffd817036b843392a451f35b905090610604565b5082346104f75760603660031901126104f75761067f61102d565b610687611043565b9165ffffffffffff60443581811692908381036102e057338852602091600183528789209560018060a01b0380911696878b528452888a20971696878a5283528789205460d01c938486111561075c5761ffff90858403161161074e575033885260018252868820858952825286882086895282528688209081549065ffffffffffff60d01b9060d01b169060018060d01b031617905585519283528201527f55eb90d810e1700b35a8e7e25395ff7f2b2259abd7415ca2284dfb1c246418f3843392a451f35b8751631269ad1360e11b8152fd5b508751633ab3447f60e11b8152fd5b50346102ec57806003193601126102ec5760209181906001600160a01b0361079161102d565b1681528084528181206024358252845220549051908152f35b5082346104f757816003193601126104f7573560243533845283602052828420828552602052828420818154179055825191825260208201527f3704902f963766a4e561bbaab6e6cdc1b1dd12f6e9e99648da8843b3f46b918d823392a251f35b50346102ec5760803660031901126102ec5761082561102d565b61082d611043565b610835611059565b606435916001600160a01b0383168303610852576102ac9361167a565b8580fd5b50346102ec57816003193601126102ec5760209061087261126e565b9051908152f35b5082346104f7576101003660031901126104f75761089636611083565b826083193601126102e8576108a9611012565b60e4356001600160401b038111610852576102ac936108ca913691016110ee565b9290916108d782516118e9565b60208301518784015188519160208301937f939c21a48a8dbe3a9a2404a1d46691e4d39f6583d6ec6b35714604c986d8010685528a840152336060840152608083015260a082015260a0815261092c81610fd6565b51902091611963565b50346102ec576101003660031901126102ec5761095061102d565b36602319019060c082126102e857608083519261096c84610fa0565b126102e857825161097c81610f6f565b6001600160a01b03906024358281168103610417578152604435828116810361041757602082015265ffffffffffff60643581811681036102e057868301526084359081168103610417576060820152835260a435928184168403610852576020810193845260c4359685820188815260e4356001600160401b0381116102dc57610a0a90369084016110ee565b929099804211610a95575050869798610a8b92610a856102ac998894610a308851611329565b90898c511690519083519260208401947ff3841cd1ff0085026a6327b620b67997ce40f282c88a8e905a7a5626e310f3d086528401526060830152608082015260808152610a7d81610fbb565b5190206115c7565b916113c6565b51925116916117de565b885163cd21db4f60e01b81529182015260249150fd5b50346102ec5760031992606036850181136102e857610ac861102d565b9160248035916001600160401b03978884116102e057849084360301126104175785519784890189811082821117610cfb578752838201358181116102dc57840190366023830112156102dc578282013591610b238361111b565b90610b308a519283610ff1565b838252602093868584019160071b83010191368311610cf7578701905b828210610c99575050508a526044610b6685870161106f565b95838c01968752013593888b0191858352604435908111610c9557610b8e90369086016110ee565b949095804211610c8357505050899798995151610baa8161160c565b908b5b818110610c5e57505089610c2a9593899593610a85938351610bd68161038f868201809561164d565b5190209060018060a01b039a8b8b51169151928551948501957faf1b0d30d2cab0380e68f0689007e3254993c596f2fdd0aaa7f4d04f794408638752850152830152608082015260808152610a7d81610fbb565b51169082515192855b848110610c3f57868651f35b80610c588585610c5260019587516115f8565b516117de565b01610c33565b806102c7610c748d9f9e9d93610c7a94516115f8565b51611329565b9b999a9b610bad565b8a5163cd21db4f60e01b815291820152fd5b8a80fd5b608082360312610cf757856080918d805190610cb482610f6f565b610cbd8661106f565b8252610cca84870161106f565b84830152610cd9818701611132565b90820152610ce88d8601611132565b8d820152815201910190610b4d565b8c80fd5b634e487b7160e01b8952604183528389fd5b5082346104f7576101403660031901126104f757610d2a36611083565b826083193601126102e857610d3d611012565b906001600160401b03906101043582811161041757610d5f90369086016110ee565b939092610124359081116102e0576102ac95610d7d913691016110ee565b949093875190610d8c82610fbb565b606482527f5065726d69745769746e6573735472616e7366657246726f6d28546f6b656e5060208301527f65726d697373696f6e73207065726d69747465642c6164647265737320737065898301527f6e6465722c75696e74323536206e6f6e63652c75696e7432353620646561646c6060830152631a5b994b60e21b6080830152885192839181610e22602085018096611938565b918237018a81520391610e3d601f1993848101835282610ff1565b5190209061092c610e4e85516118e9565b6020868101518b8801518c519283019687526040830193909352336060830152608082015260a081019190915260e43560c0820152918260e08101610297565b5082346104f7576020806003193601126102e85781356001600160401b03928382116108525736602383011215610852578101359283116102e4576024906007368386831b8401011161041757865b858110610ee957878751f35b80821b830190608060231983360301126102dc57610f69888760019460608351610f1281610f6f565b610f4e6084610f228d860161106f565b94858452610f326044820161106f565b8097850152610f436064820161106f565b80988501520161106f565b9182910152868060a01b03808080931695169316911661167a565b01610edd565b608081019081106001600160401b03821117610f8a57604052565b634e487b7160e01b600052604160045260246000fd5b606081019081106001600160401b03821117610f8a57604052565b60a081019081106001600160401b03821117610f8a57604052565b60c081019081106001600160401b03821117610f8a57604052565b90601f801991011681019081106001600160401b03821117610f8a57604052565b60c435906001600160a01b038216820361102857565b600080fd5b600435906001600160a01b038216820361102857565b602435906001600160a01b038216820361102857565b604435906001600160a01b038216820361102857565b35906001600160a01b038216820361102857565b60031901906080821261102857604080519061109e82610fa0565b808294126110285780518181018181106001600160401b03821117610f8a5782526004356001600160a01b0381168103611028578152602435602082015282526044356020830152606435910152565b9181601f84011215611028578235916001600160401b038311611028576020838186019501011161102857565b6001600160401b038111610f8a5760051b60200190565b359065ffffffffffff8216820361102857565b9181601f84011215611028578235916001600160401b038311611028576020808501948460061b01011161102857565b91909160608184031261102857604080519161119083610fa0565b829481356001600160401b039081811161102857830182601f820112156110285780356111bc8161111b565b926111c987519485610ff1565b818452602094858086019360061b85010193818511611028579086899897969594939201925b84841061120c575050505050855280820135908501520135910152565b909192939495969784830312611028578851908982019082821085831117611259578a928992845261123d8761106f565b81528287013583820152815201930191908897969594936111ef565b60246000634e487b7160e01b81526041600452fd5b467f0000000000000000000000000000000000000000000000000000000000000000036112b9577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a86682527f9ac997416e8ff9d2ff6bebeb7149f65cdae5e32e2b90440b566bb3044041d36a60408201524660608201523060808201526080815261132381610fbb565b51902090565b60405160208101917f65626cad6cb96493bf6f5ebea28756c966f023ab9e8a83a7101849d5573b3678835260018060a01b038082511660408401526020820151166060830152606065ffffffffffff9182604082015116608085015201511660a082015260a0815260c081018181106001600160401b03821117610f8a5760405251902090565b9190826040910312611028576020823592013590565b6000843b6114eb575060418203611485576113e3828201826113b0565b9390926040101561146f5760209360009360ff6040608095013560f81c5b60405194855216868401526040830152606082015282805260015afa15611463576000516001600160a01b0390811691821561145157160361143f57565b604051632057875960e21b8152600490fd5b604051638baa579f60e01b8152600490fd5b6040513d6000823e3d90fd5b634e487b7160e01b600052603260045260246000fd5b604082036114d957611499918101906113b0565b6001600160ff1b0381169260ff91821c601b019182116114c35760209360009360ff608094611401565b634e487b7160e01b600052601160045260246000fd5b604051634be6321b60e01b8152600490fd5b918093946020926064604051809781958294630b135d3f60e11b9b8c8552600485015260406024850152816044850152848401378181018301889052601f01601f191681010301916001600160a01b03165afa9182156115ba578192611571575b50506001600160e01b0319160361155f57565b604051632c19a72f60e21b8152600490fd5b9091506020813d82116115b2575b8161158c60209383610ff1565b810103126102ec5751906001600160e01b0319821682036115af5750388061154c565b80fd5b3d915061157f565b50604051903d90823e3d90fd5b6115cf61126e565b9060405190602082019261190160f01b8452602283015260428201526042815261132381610f6f565b805182101561146f5760209160051b010190565b906116168261111b565b6116236040519182610ff1565b8281528092611634601f199161111b565b0190602036910137565b60001981146114c35760010190565b805160208092019160005b828110611666575050505090565b835185529381019392810192600101611658565b92919260018060a01b03604060008284168152600160205282828220961695868252602052818120338252602052209485549565ffffffffffff8760a01c168042116117265750828716968388036116dd575b50506116db9550169261173e565b565b87848416116000146117025760405163f96fb07160e01b815260048101899052602490fd5b83836116db990316906bffffffffffffffffffffffff60a01b1617905538806116cd565b60249060405190636c0d979760e11b82526004820152fd5b9060006064926020958295604051946323b872dd60e01b86526004860152602485015260448401525af13d15601f3d116001600051141617161561177e57565b60405162461bcd60e51b81526020600482015260146024820152731514905394d1915497d19493d357d1905253115160621b6044820152606490fd5b919081101561146f5760061b0190565b356001600160a01b03811681036110285790565b9065ffffffffffff908160608401511660018060a01b03908185511694826020820151169280866040809401511695169560009187835260016020528383208984526020528383209916988983526020528282209184835460d01c036118d85791856118cc94927fc6a377bfc4eb120024a8ac08eef205be16b817020812c73223e81d1bdb9708ec989796945087156000146118d15742165b6001850160d01b6001600160d01b03191660a09190911b65ffffffffffff60a01b1617179055516001600160a01b03909316835265ffffffffffff938416602084015290921660408201529081906060820190565b0390a4565b5086611877565b8351633ab3447f60e11b8152600490fd5b6040516020808201927f618358ac3db8dc274f0cd8829da7e234bd48cd73c4a740aede1adec9846d06a1845260018060a01b038151166040840152015160608201526060815261132381610f6f565b9081519160005b838110611950575050016000815290565b806020809284010151818501520161193f565b9192909360a4359360408401518042116119de57506020845101518086116119c65750918591610a856119a39461199e602088015186611af1565b6115c7565b51516001600160a01b03908116926084359182168203611028576116db9361173e565b60249060405190633728b83d60e01b82526004820152fd5b6024906040519063cd21db4f60e01b82526004820152fd5b959093958051519560409283830151804211611ada5750848803611ac657611a2d918691610a8560209b61199e8d88015186611af1565b60005b868110611a41575050505050505050565b611a4c8183516115f8565b5188611a5983878a6117ba565b01359089810151808311611aaf575091818888886001968596611a83575b50505050505001611a30565b611aa495611a9e9261046d928a8060a01b03905116956117ba565b9161173e565b803888888883611a77565b602490865190633728b83d60e01b82526004820152fd5b83516001621398b960e31b03198152600490fd5b60249085519063cd21db4f60e01b82526004820152fd5b90600160ff82161b9160018060a01b0316600052600060205260406000209060081c6000526020526040600020818154188091551615611b2d57565b604051633ab3447f60e11b8152600490fdfea26469706673582212209784f7365c04cb1f3e89a49efec2224ab35ffe6310c1a867f563446a98eea14e64736f6c63430008100033',
  deployedBytecode:
    '0x6040608081526004908136101561001557600080fd5b600090813560e01c80630d58b1db14610e8e578063137c29fe14610d0d5780632a2d80d114610aab5780632b67b5701461093557806330f28b7a146108795780633644e5151461085657806336c785161461080b5780633ff9dcb1146107aa5780634fe02b441461076b57806365d9723c1461066457806387517c4514610587578063927da105146104fb578063cc53287f1461041b578063edd9444b146102f05763fe8ec1a7146100c657600080fd5b346102ec5760c03660031901126102ec576001600160401b0383358181116102e8576100f59036908601611175565b906024358181116102e45761010d9036908701611145565b610118939193611059565b906084358481116102e0576101309036908a016110ee565b98909460a4359081116102dc57610149913691016110ee565b95909487519061015882610fbb565b606b82527f5065726d697442617463685769746e6573735472616e7366657246726f6d285460208301527f6f6b656e5065726d697373696f6e735b5d207065726d69747465642c61646472898301527f657373207370656e6465722c75696e74323536206e6f6e63652c75696e74323560608301526a0d88191958591b1a5b994b60aa1b608083015288519a8b91816101f5602085018096611938565b918237018a81520399610210601f199b8c8101835282610ff1565b51902084515161021f8161160c565b908a5b8181106102af575050976102a3819a9b6102ac9a83516102568161024a60208201809561164d565b03848101835282610ff1565b519020602089810151858b015195519182019687526040820192909252336060820152608081019190915260a081019390935260643560c08401528260e081015b03908101835282610ff1565b519020936119f6565b51f35b806102c76102c16102d7938b516115f8565b516118e9565b6102d182866115f8565b5261163e565b610222565b8880fd5b8780fd5b8480fd5b8380fd5b5080fd5b50346102ec5760803660031901126102ec576001600160401b0383358181116102e8576103209036908601611175565b6024358281116102e4576103379036908701611145565b919095610342611059565b9360643590811161041757610359913691016110ee565b939092825151976103698961160c565b98885b8181106103f55750508697986102ac975161039d8161038f60208201809561164d565b03601f198101835282610ff1565b5190206020850151898601518a519160208301937ffcf35f5ac6a2c28868dc44c302166470266239195f02b0ee408334829333b76685528c840152336060840152608083015260a082015260a081526102a381610fd6565b808b6102d18261040c6102c1610412968c516115f8565b926115f8565b61036c565b8680fd5b5082346104f757602090816003193601126102e8578035906001600160401b0382116102e45761044d91369101611145565b91845b83811061045c57858551f35b8061047261046d60019387876117ba565b6117ca565b610487846104818489896117ba565b016117ca565b33895283855287892091848060a01b0380911692838b528652888a20911690818a5285528789206bffffffffffffffffffffffff60a01b81541690558751918252848201527f89b1add15eff56b3dfe299ad94e01f2b52fbcb80ae1a3baea6ae8c04cb2b98a4873392a201610450565b8280fd5b50346102ec5760603660031901126102ec576105838161051961102d565b93610522611043565b61052a611059565b6001600160a01b03968716835260016020908152848420928816845291825283832090871683528152919020549251938316845260a083901c65ffffffffffff169084015260d09190911c604083015281906060820190565b0390f35b50346102ec5760803660031901126102ec576105a161102d565b6105a9611043565b906105b2611059565b65ffffffffffff91606435838116918282036102e05733885260016020528688209460018060a01b0380921695868a5260205281888a20971696878a5260205287892092841560001461065c57504216905b8254941693849165ffffffffffff60a01b9060a01b169065ffffffffffff60d01b1617179055845191825260208201527fda9fa7c1b00402c17d0161b249b1ab8bbec047c5a52207b9c112deffd817036b843392a451f35b905090610604565b5082346104f75760603660031901126104f75761067f61102d565b610687611043565b9165ffffffffffff60443581811692908381036102e057338852602091600183528789209560018060a01b0380911696878b528452888a20971696878a5283528789205460d01c938486111561075c5761ffff90858403161161074e575033885260018252868820858952825286882086895282528688209081549065ffffffffffff60d01b9060d01b169060018060d01b031617905585519283528201527f55eb90d810e1700b35a8e7e25395ff7f2b2259abd7415ca2284dfb1c246418f3843392a451f35b8751631269ad1360e11b8152fd5b508751633ab3447f60e11b8152fd5b50346102ec57806003193601126102ec5760209181906001600160a01b0361079161102d565b1681528084528181206024358252845220549051908152f35b5082346104f757816003193601126104f7573560243533845283602052828420828552602052828420818154179055825191825260208201527f3704902f963766a4e561bbaab6e6cdc1b1dd12f6e9e99648da8843b3f46b918d823392a251f35b50346102ec5760803660031901126102ec5761082561102d565b61082d611043565b610835611059565b606435916001600160a01b0383168303610852576102ac9361167a565b8580fd5b50346102ec57816003193601126102ec5760209061087261126e565b9051908152f35b5082346104f7576101003660031901126104f75761089636611083565b826083193601126102e8576108a9611012565b60e4356001600160401b038111610852576102ac936108ca913691016110ee565b9290916108d782516118e9565b60208301518784015188519160208301937f939c21a48a8dbe3a9a2404a1d46691e4d39f6583d6ec6b35714604c986d8010685528a840152336060840152608083015260a082015260a0815261092c81610fd6565b51902091611963565b50346102ec576101003660031901126102ec5761095061102d565b36602319019060c082126102e857608083519261096c84610fa0565b126102e857825161097c81610f6f565b6001600160a01b03906024358281168103610417578152604435828116810361041757602082015265ffffffffffff60643581811681036102e057868301526084359081168103610417576060820152835260a435928184168403610852576020810193845260c4359685820188815260e4356001600160401b0381116102dc57610a0a90369084016110ee565b929099804211610a95575050869798610a8b92610a856102ac998894610a308851611329565b90898c511690519083519260208401947ff3841cd1ff0085026a6327b620b67997ce40f282c88a8e905a7a5626e310f3d086528401526060830152608082015260808152610a7d81610fbb565b5190206115c7565b916113c6565b51925116916117de565b885163cd21db4f60e01b81529182015260249150fd5b50346102ec5760031992606036850181136102e857610ac861102d565b9160248035916001600160401b03978884116102e057849084360301126104175785519784890189811082821117610cfb578752838201358181116102dc57840190366023830112156102dc578282013591610b238361111b565b90610b308a519283610ff1565b838252602093868584019160071b83010191368311610cf7578701905b828210610c99575050508a526044610b6685870161106f565b95838c01968752013593888b0191858352604435908111610c9557610b8e90369086016110ee565b949095804211610c8357505050899798995151610baa8161160c565b908b5b818110610c5e57505089610c2a9593899593610a85938351610bd68161038f868201809561164d565b5190209060018060a01b039a8b8b51169151928551948501957faf1b0d30d2cab0380e68f0689007e3254993c596f2fdd0aaa7f4d04f794408638752850152830152608082015260808152610a7d81610fbb565b51169082515192855b848110610c3f57868651f35b80610c588585610c5260019587516115f8565b516117de565b01610c33565b806102c7610c748d9f9e9d93610c7a94516115f8565b51611329565b9b999a9b610bad565b8a5163cd21db4f60e01b815291820152fd5b8a80fd5b608082360312610cf757856080918d805190610cb482610f6f565b610cbd8661106f565b8252610cca84870161106f565b84830152610cd9818701611132565b90820152610ce88d8601611132565b8d820152815201910190610b4d565b8c80fd5b634e487b7160e01b8952604183528389fd5b5082346104f7576101403660031901126104f757610d2a36611083565b826083193601126102e857610d3d611012565b906001600160401b03906101043582811161041757610d5f90369086016110ee565b939092610124359081116102e0576102ac95610d7d913691016110ee565b949093875190610d8c82610fbb565b606482527f5065726d69745769746e6573735472616e7366657246726f6d28546f6b656e5060208301527f65726d697373696f6e73207065726d69747465642c6164647265737320737065898301527f6e6465722c75696e74323536206e6f6e63652c75696e7432353620646561646c6060830152631a5b994b60e21b6080830152885192839181610e22602085018096611938565b918237018a81520391610e3d601f1993848101835282610ff1565b5190209061092c610e4e85516118e9565b6020868101518b8801518c519283019687526040830193909352336060830152608082015260a081019190915260e43560c0820152918260e08101610297565b5082346104f7576020806003193601126102e85781356001600160401b03928382116108525736602383011215610852578101359283116102e4576024906007368386831b8401011161041757865b858110610ee957878751f35b80821b830190608060231983360301126102dc57610f69888760019460608351610f1281610f6f565b610f4e6084610f228d860161106f565b94858452610f326044820161106f565b8097850152610f436064820161106f565b80988501520161106f565b9182910152868060a01b03808080931695169316911661167a565b01610edd565b608081019081106001600160401b03821117610f8a57604052565b634e487b7160e01b600052604160045260246000fd5b606081019081106001600160401b03821117610f8a57604052565b60a081019081106001600160401b03821117610f8a57604052565b60c081019081106001600160401b03821117610f8a57604052565b90601f801991011681019081106001600160401b03821117610f8a57604052565b60c435906001600160a01b038216820361102857565b600080fd5b600435906001600160a01b038216820361102857565b602435906001600160a01b038216820361102857565b604435906001600160a01b038216820361102857565b35906001600160a01b038216820361102857565b60031901906080821261102857604080519061109e82610fa0565b808294126110285780518181018181106001600160401b03821117610f8a5782526004356001600160a01b0381168103611028578152602435602082015282526044356020830152606435910152565b9181601f84011215611028578235916001600160401b038311611028576020838186019501011161102857565b6001600160401b038111610f8a5760051b60200190565b359065ffffffffffff8216820361102857565b9181601f84011215611028578235916001600160401b038311611028576020808501948460061b01011161102857565b91909160608184031261102857604080519161119083610fa0565b829481356001600160401b039081811161102857830182601f820112156110285780356111bc8161111b565b926111c987519485610ff1565b818452602094858086019360061b85010193818511611028579086899897969594939201925b84841061120c575050505050855280820135908501520135910152565b909192939495969784830312611028578851908982019082821085831117611259578a928992845261123d8761106f565b81528287013583820152815201930191908897969594936111ef565b60246000634e487b7160e01b81526041600452fd5b467f0000000000000000000000000000000000000000000000000000000000000000036112b9577f000000000000000000000000000000000000000000000000000000000000000090565b60405160208101907f8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a86682527f9ac997416e8ff9d2ff6bebeb7149f65cdae5e32e2b90440b566bb3044041d36a60408201524660608201523060808201526080815261132381610fbb565b51902090565b60405160208101917f65626cad6cb96493bf6f5ebea28756c966f023ab9e8a83a7101849d5573b3678835260018060a01b038082511660408401526020820151166060830152606065ffffffffffff9182604082015116608085015201511660a082015260a0815260c081018181106001600160401b03821117610f8a5760405251902090565b9190826040910312611028576020823592013590565b6000843b6114eb575060418203611485576113e3828201826113b0565b9390926040101561146f5760209360009360ff6040608095013560f81c5b60405194855216868401526040830152606082015282805260015afa15611463576000516001600160a01b0390811691821561145157160361143f57565b604051632057875960e21b8152600490fd5b604051638baa579f60e01b8152600490fd5b6040513d6000823e3d90fd5b634e487b7160e01b600052603260045260246000fd5b604082036114d957611499918101906113b0565b6001600160ff1b0381169260ff91821c601b019182116114c35760209360009360ff608094611401565b634e487b7160e01b600052601160045260246000fd5b604051634be6321b60e01b8152600490fd5b918093946020926064604051809781958294630b135d3f60e11b9b8c8552600485015260406024850152816044850152848401378181018301889052601f01601f191681010301916001600160a01b03165afa9182156115ba578192611571575b50506001600160e01b0319160361155f57565b604051632c19a72f60e21b8152600490fd5b9091506020813d82116115b2575b8161158c60209383610ff1565b810103126102ec5751906001600160e01b0319821682036115af5750388061154c565b80fd5b3d915061157f565b50604051903d90823e3d90fd5b6115cf61126e565b9060405190602082019261190160f01b8452602283015260428201526042815261132381610f6f565b805182101561146f5760209160051b010190565b906116168261111b565b6116236040519182610ff1565b8281528092611634601f199161111b565b0190602036910137565b60001981146114c35760010190565b805160208092019160005b828110611666575050505090565b835185529381019392810192600101611658565b92919260018060a01b03604060008284168152600160205282828220961695868252602052818120338252602052209485549565ffffffffffff8760a01c168042116117265750828716968388036116dd575b50506116db9550169261173e565b565b87848416116000146117025760405163f96fb07160e01b815260048101899052602490fd5b83836116db990316906bffffffffffffffffffffffff60a01b1617905538806116cd565b60249060405190636c0d979760e11b82526004820152fd5b9060006064926020958295604051946323b872dd60e01b86526004860152602485015260448401525af13d15601f3d116001600051141617161561177e57565b60405162461bcd60e51b81526020600482015260146024820152731514905394d1915497d19493d357d1905253115160621b6044820152606490fd5b919081101561146f5760061b0190565b356001600160a01b03811681036110285790565b9065ffffffffffff908160608401511660018060a01b03908185511694826020820151169280866040809401511695169560009187835260016020528383208984526020528383209916988983526020528282209184835460d01c036118d85791856118cc94927fc6a377bfc4eb120024a8ac08eef205be16b817020812c73223e81d1bdb9708ec989796945087156000146118d15742165b6001850160d01b6001600160d01b03191660a09190911b65ffffffffffff60a01b1617179055516001600160a01b03909316835265ffffffffffff938416602084015290921660408201529081906060820190565b0390a4565b5086611877565b8351633ab3447f60e11b8152600490fd5b6040516020808201927f618358ac3db8dc274f0cd8829da7e234bd48cd73c4a740aede1adec9846d06a1845260018060a01b038151166040840152015160608201526060815261132381610f6f565b9081519160005b838110611950575050016000815290565b806020809284010151818501520161193f565b9192909360a4359360408401518042116119de57506020845101518086116119c65750918591610a856119a39461199e602088015186611af1565b6115c7565b51516001600160a01b03908116926084359182168203611028576116db9361173e565b60249060405190633728b83d60e01b82526004820152fd5b6024906040519063cd21db4f60e01b82526004820152fd5b959093958051519560409283830151804211611ada5750848803611ac657611a2d918691610a8560209b61199e8d88015186611af1565b60005b868110611a41575050505050505050565b611a4c8183516115f8565b5188611a5983878a6117ba565b01359089810151808311611aaf575091818888886001968596611a83575b50505050505001611a30565b611aa495611a9e9261046d928a8060a01b03905116956117ba565b9161173e565b803888888883611a77565b602490865190633728b83d60e01b82526004820152fd5b83516001621398b960e31b03198152600490fd5b60249085519063cd21db4f60e01b82526004820152fd5b90600160ff82161b9160018060a01b0316600052600060205260406000209060081c6000526020526040600020818154188091551615611b2d57565b604051633ab3447f60e11b8152600490fdfea26469706673582212209784f7365c04cb1f3e89a49efec2224ab35ffe6310c1a867f563446a98eea14e64736f6c63430008100033',
  linkReferences: {},
  deployedLinkReferences: {},
};
