import { DZapTransactionResponse, HexString } from '..';
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

/**
 * What `zap` resolves to. When a step is still pending once its wait times out, `status` is `mining`, `txnHash` is
 * that step's hash and `remainingSteps` are the steps not sent yet: wait for the hash to settle, then call `zap`
 * again with `steps: remainingSteps`, so that no step is sent twice.
 */
export type ZapTransactionResponse = DZapTransactionResponse & {
  remainingSteps?: ZapTransactionStep[];
};
