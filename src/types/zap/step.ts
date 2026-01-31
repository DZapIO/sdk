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

export type ZapTxnDetails = ZapEvmTxnDetails | ZapBvmTxnDetails;

export type ZapTransactionStep<T extends ZapTxnDetails = ZapTxnDetails> = {
  action: StepAction;
  data: T;
};

export type ZapStep = ZapTransactionStep;

/** Minimal payload for sending zap build to chain client (e.g. BVM); full response may not be available when steps are provided by caller. */
export type ZapBuildTxnPayload = { steps: ZapStep[] };
