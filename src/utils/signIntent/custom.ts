import { StatusCodes, TxnStatus } from '../../enums';
import { HexString } from '../../types';
import { CustomTypedDataParams } from '../../types/permit';
import { handleViemTransactionError } from '../errors';
import { signTypedData } from '../signTypedData';

export const signCustomTypedData = async (
  params: CustomTypedDataParams,
): Promise<{
  status: TxnStatus;
  code: StatusCodes;
  data?: {
    signature: HexString;
    message: Record<string, any>;
  };
}> => {
  try {
    const { account, signer, message, domain, primaryType, types } = params;

    const signature = await signTypedData({
      signer,
      account,
      domain,
      message,
      primaryType,
      types,
    });
    return {
      status: TxnStatus.success,
      code: StatusCodes.Success,
      data: {
        signature,
        message,
      },
    };
  } catch (error: any) {
    return handleViemTransactionError({ error });
  }
};
