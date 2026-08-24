import { TypedData, TypedDataDomain } from 'viem';
import { HexString } from '..';
import { chainTypes } from '../../constants/chains';
import { zapBroadcastMode, zapPreExecutionStepType, zapSignStepKind, zapStepAction } from '../../zap/constants/step';

export type StepAction = keyof typeof zapStepAction;

export type ZapSignStepKind = keyof typeof zapSignStepKind;

export type ZapBroadcastMode = (typeof zapBroadcastMode)[keyof typeof zapBroadcastMode];

export type ZapPreExecutionStepType = keyof typeof zapPreExecutionStepType;

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

export type ZapTypedDataPayload = {
  domain: TypedDataDomain;
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
};

/**
 * A step the caller must complete before the route can be built. The signature is fed back into the
 * next quote/buildTx request as `preExecutionStepsData`, matched to this step by `id`.
 */
export type ZapSignPreExecutionStep = {
  id: string;
  type: typeof zapPreExecutionStepType.sign;
  data: ZapTypedDataPayload;
};

export type ZapPreExecutionStep = ZapSignPreExecutionStep;

export type ZapSignPreExecutionStepData = {
  id: string;
  type: typeof zapPreExecutionStepType.sign;
  signature: HexString;
  message: Record<string, unknown>;
};

export type ZapPreExecutionStepData = ZapSignPreExecutionStepData;

type ZapSignStepDataBase = {
  type: keyof typeof chainTypes;
  txnId: HexString;
};

/**
 * Perps actions are not executed by the SDK yet — the type exists so `sign` steps of this kind can be
 * recognised and rejected explicitly rather than silently mishandled.
 */
export type ZapPerpsSignStepData = ZapSignStepDataBase & {
  kind: typeof zapSignStepKind.perpsActions;
  actions: unknown[];
};

export type ZapLimitOrderSignStepData = ZapSignStepDataBase & {
  kind: typeof zapSignStepKind.limitOrder;
  providerId: string;
  typedData: ZapTypedDataPayload;
};

export type ZapSignStepData = ZapPerpsSignStepData | ZapLimitOrderSignStepData;

export type ZapBroadcastStepData = {
  type: keyof typeof chainTypes;
  txnId: HexString;
  chainId: number;
  providerId: string;
  payload: unknown;
};

export type ZapTxnStepAction = typeof zapStepAction.execute | typeof zapStepAction.approve;

export type ZapTransactionStep<T extends ZapTxnDetails = ZapTxnDetails> =
  | { action: typeof zapStepAction.approve; data: T }
  | { action: typeof zapStepAction.execute; data: T }
  | { action: typeof zapStepAction.sign; data: ZapSignStepData }
  | { action: typeof zapStepAction.broadcast; data: ZapBroadcastStepData };

export type ZapStep = ZapTransactionStep;

const zapTxnStepActions: StepAction[] = [zapStepAction.approve, zapStepAction.execute];

export const isZapTxnStep = <T extends ZapTxnDetails>(step: ZapTransactionStep<T>): step is { action: ZapTxnStepAction; data: T } =>
  zapTxnStepActions.includes(step.action);
