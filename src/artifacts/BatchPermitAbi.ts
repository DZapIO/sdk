export const BatchPermitAbiParams = [
  {
    name: 'permit',
    type: 'tuple',
    components: [
      {
        name: 'permitted',
        type: 'tuple[]',
        components: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  { name: 'permitSignature', type: 'bytes' },
] as const;
