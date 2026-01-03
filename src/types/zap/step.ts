import { HexString } from '..';
import { ZAP_STEP_ACTIONS } from '../../constants';
import { chainTypes } from '../../constants/chains';

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

export type ZapTxnDetails = ZapEvmTxnDetails | ZapBvmTxnDetails;

export type ZapTransactionStep<T extends ZapTxnDetails = ZapTxnDetails> = {
  action: StepAction;
  data: T;
};

export type ZapStep = ZapTransactionStep;
