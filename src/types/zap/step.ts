import { HexString } from '..';
import { zapStepAction } from '../../constants';
import { chainTypes } from '../../constants/chains';

export type StepAction = keyof typeof zapStepAction;

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
