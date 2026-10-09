import { StatusCodes, TxnStatus } from '../../enums';
import { HexString } from '../../types';
import { CustomTypedDataParams } from '../../types/permit';
import { handleViemTransactionError } from '../errors';
import { signTypedData } from '../signTypedData';

type SignCustomTypedDataSuccessResult = {
  status: TxnStatus.success;
  code: StatusCodes;
  data: {
    signature: HexString;
    message: Record<string, any>;
  };
};

type SignCustomTypedDataResult = ReturnType<typeof handleViemTransactionError>;

export const signCustomTypedData = async (params: CustomTypedDataParams): Promise<SignCustomTypedDataSuccessResult | SignCustomTypedDataResult> => {
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
