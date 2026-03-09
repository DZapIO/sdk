import type { Signer, TypedDataField } from 'ethers';
import type { TypedDataDomain, WalletClient } from 'viem';

import type { HexString } from '..';
import type { GASLESS_TX_TYPE } from '../constants';

type GaslessBaseParams = {
  gasless: true;
  txId: HexString;
  executorFeesHash: HexString;
};

export type GaslessSwapParams = {
  txType: typeof GASLESS_TX_TYPE.swap;
  swapDataHash: HexString;
} & GaslessBaseParams;

export type GaslessBridgeParams = {
  txType: typeof GASLESS_TX_TYPE.bridge;
  adapterDataHash: HexString;
  swapDataHash?: HexString;
} & GaslessBaseParams;

export type CustomTypedDataParams = {
  account: HexString;
  signer: WalletClient | Signer;
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>;
  primaryType: string;
};
