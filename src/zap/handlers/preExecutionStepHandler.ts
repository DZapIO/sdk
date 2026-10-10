import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { StatusCodes, TxnStatus } from '../../enums';
import { HexString } from '../../types';
import { TransactionError } from '../../types/error';
import { ZapPreExecutionStepType } from '../../types/zap';
import { ZapPreExecutionResult, ZapPreExecutionStep, ZapPreExecutionStepData, ZapSignPreExecutionStep } from '../../types/zap/step';
import { getSignerAddress } from '../../utils';
import { handleViemTransactionError } from '../../utils/errors';
import { signCustomTypedData } from '../../utils/signIntent/custom';
import { zapPreExecutionStepType } from '../constants/step';

type StepHandlerParams<T extends ZapPreExecutionStep = ZapPreExecutionStep> = {
  step: T;
  signer: Signer | WalletClient;
  account?: string;
};

type StepHandlerResult = ZapPreExecutionStepData | TransactionError;

class ZapPreExecutionStepHandler {
  private static handleSignStep = async ({ step, signer, account }: StepHandlerParams<ZapSignPreExecutionStep>): Promise<StepHandlerResult> => {
    const { domain, types, message, primaryType } = step.data;
    const result = await signCustomTypedData({
      signer,
      account: (account as HexString) ?? (await getSignerAddress(signer)),
      domain,
      types,
      message,
      primaryType,
    });
    if (result.status !== TxnStatus.success) {
      return result;
    }
    return {
      id: step.id,
      type: zapPreExecutionStepType.sign,
      signature: result.data.signature,
      message,
    };
  };

  private static stepHandler: {
    [K in ZapPreExecutionStepType]: (params: StepHandlerParams<Extract<ZapPreExecutionStep, { type: K }>>) => Promise<StepHandlerResult>;
  } = {
    [zapPreExecutionStepType.sign]: ZapPreExecutionStepHandler.handleSignStep,
  };

  private static handleStep = async <T extends ZapPreExecutionStep>(params: StepHandlerParams<T>): Promise<StepHandlerResult> => {
    const handler = ZapPreExecutionStepHandler.stepHandler[params.step.type];
    if (!handler) {
      throw new Error(`No handler found for pre-execution step type: ${params.step.type}`);
    }
    return handler(params);
  };

  public static handle = async ({
    steps,
    signer,
    account,
  }: {
    steps?: ZapPreExecutionStep[];
    signer: Signer | WalletClient;
    account?: string;
  }): Promise<ZapPreExecutionResult> => {
    if (!steps || steps.length === 0) {
      return { status: TxnStatus.success, code: StatusCodes.Success, preExecutionStepsData: [] };
    }

    try {
      const preExecutionStepsData: ZapPreExecutionStepData[] = [];
      for (const step of steps) {
        const result = await ZapPreExecutionStepHandler.handleStep({ step, signer, account });
        if (!('id' in result)) {
          return result;
        }
        preExecutionStepsData.push(result);
      }
      return { status: TxnStatus.success, code: StatusCodes.Success, preExecutionStepsData };
    } catch (error: unknown) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };
}

export default ZapPreExecutionStepHandler;
