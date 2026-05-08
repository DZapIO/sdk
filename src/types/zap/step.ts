import { HexString } from '..';
import { chainTypes } from '../../constants/chains';
import { zapStepAction } from '../../zap/constants/step';

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

export type SVMTxnDetails = {
  type: typeof chainTypes.svm;
  txnId: HexString;
  data: string[];
  blockhash?: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
  estimatedGas: string;
  isJitoTx?: boolean;
};

export type ZapTxnDetails = ZapEvmTxnDetails | ZapBvmTxnDetails | SVMTxnDetails;

export type ZapTransactionStep<T extends ZapTxnDetails = ZapTxnDetails> = {
  action: StepAction;
  data: T;
};

export type ZapStep = ZapTransactionStep;
