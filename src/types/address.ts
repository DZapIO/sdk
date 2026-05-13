export enum AddressKind {
  INVALID = 'invalid',
  NATIVE = 'native',
  TOKEN = 'token',
  CONTRACT = 'contract',
  WALLET = 'wallet',
}

export type AddressClassifyResult = {
  valid: boolean;
  kind: AddressKind;
  isNative: boolean;
  isToken: boolean;
  isContract: boolean;
  address: string;
};
