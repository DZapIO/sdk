import { TypedData, TypedDataDomain } from 'viem';
import { HexString } from '..';
import { chainTypes } from '../../constants/chains';
import { zapPreExecutionStepType, zapStepAction } from '../../zap/constants/step';

export type StepAction = keyof typeof zapStepAction;

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

export type ZapTransactionStep<T extends ZapTxnDetails = ZapTxnDetails> = {
  action: StepAction;
  data: T;
};

export type ZapStep = ZapTransactionStep;
