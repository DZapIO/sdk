declare module 'bitcoin-address-validation' {
  export const Network: {
    mainnet: string;
    testnet: string;
  };
  export function validate(address: string, network?: string): boolean;
}
