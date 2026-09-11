import { Signer } from 'ethers';
import { WalletClient } from 'viem';
import { StatusCodes, TxnStatus } from '../../enums';
import { DZapTransactionResponse, HexString } from '../../types';
import { ZapPreExecutionStepType } from '../../types/zap';
import { ZapPreExecutionStep, ZapPreExecutionStepData, ZapSignPreExecutionStep } from '../../types/zap/step';
import { getSignerAddress } from '../../utils';
import { handleViemTransactionError } from '../../utils/errors';
import { signCustomTypedData } from '../../utils/signIntent/custom';
import { zapPreExecutionStepType } from '../constants/step';

export type ZapPreExecutionResult =
  | { status: TxnStatus.success; code: StatusCodes | number; preExecutionStepsData: ZapPreExecutionStepData[] }
  | DZapTransactionResponse;

class ZapPreExecutionStepHandler {
  private static handleSignStep = async ({
    step,
    signer,
    account,
  }: {
    step: ZapSignPreExecutionStep;
    signer: Signer | WalletClient;
    account?: string;
  }): Promise<ZapPreExecutionStepData> => {
    const { domain, types, message, primaryType } = step.data;
    const result = await signCustomTypedData({
      signer,
      account: (account as HexString) ?? (await getSignerAddress(signer)),
      domain,
      types,
      message,
      primaryType,
    });
    if (result.status !== TxnStatus.success || !result.data) {
      throw new Error(`Failed to sign pre-execution step ${step.id}.`);
    }
    return {
      id: step.id,
      type: zapPreExecutionStepType.sign,
      signature: result.data.signature,
      message,
    };
  };

  private static stepHandler: Record<
    ZapPreExecutionStepType,
    ({ step, signer, account }: { step: ZapPreExecutionStep; signer: Signer | WalletClient; account?: string }) => Promise<ZapPreExecutionStepData>
  > = {
    [zapPreExecutionStepType.sign]: ZapPreExecutionStepHandler.handleSignStep,
  };

  public static handleStep = async ({
    step,
    signer,
    account,
  }: {
    step: ZapPreExecutionStep;
    signer: Signer | WalletClient;
    account?: string;
  }): Promise<ZapPreExecutionStepData> => {
    const handler = ZapPreExecutionStepHandler.stepHandler[step.type];
    if (!handler) {
      throw new Error(`No handler found for pre-execution step type: ${step.type}`);
    }
    return handler({ step, signer, account });
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
        preExecutionStepsData.push(await ZapPreExecutionStepHandler.handleStep({ step, signer, account }));
      }
      return { status: TxnStatus.success, code: StatusCodes.Success, preExecutionStepsData };
    } catch (error: unknown) {
      console.log({ error });
      return handleViemTransactionError({ error });
    }
  };
}

export default ZapPreExecutionStepHandler;
