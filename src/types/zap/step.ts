import type { ZAP_STEP_ACTIONS } from '../../constants';
import type { chainTypes } from '../../constants/chains';
import type { HexString } from '..';

export type StepAction = keyof typeof ZAP_STEP_ACTIONS;

export type ZapEvmTxnDetails = {
  type: typeof chainTypes.evm;
  txnId: HexString;
  callData: HexString;
  callTo: HexString;
  value: string;
  estimatedGas: string;
};

export type ZapBvmTxnDetails = {
  type: typeof chainTypes.bvm;
  txnId: HexString;
  data: string;
};

export type SVMTxnDetails = {
  type: typeof chainTypes.svm;
  txnId: HexString;
  data: string[];
  estimatedGas: string;
  isJitoTx?: boolean;
};

export type ZapTxnDetails = ZapEvmTxnDetails | ZapBvmTxnDetails | SVMTxnDetails;

export type ZapStep<T extends ZapTxnDetails = ZapTxnDetails> = {
  action: StepAction;
  data: T;
};
