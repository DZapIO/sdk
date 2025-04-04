import { HexString } from 'src/types';
import { zapStepAction } from '../constants/step';

export type StepAction = keyof typeof zapStepAction;

export type ZapTxnDetails = {
  txnId: HexString;
  callData: HexString;
  callTo: HexString;
  value: string;
  estimatedGas: string;
};

export type ZapTransactionStep = {
  action: StepAction;
  data: ZapTxnDetails;
};

export type ZapStep = ZapTransactionStep;
