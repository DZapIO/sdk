import { ERRORS, STATUS } from 'src/constants';
import { Abi, decodeErrorResult } from 'viem';

export const handleTransactionError = ({ abi, error }: { abi: Abi; error: any }) => {
  let errMsg = ERRORS.NOT_FOUND;

  if (error.reason && error.reason.includes('reverted: ')) {
    errMsg = error.reason.split('reverted: ')[1];
  }
  if (errMsg == ERRORS.NOT_FOUND) {
    try {
      const decodedError = decodeErrorResult({
        abi,
        data: error.error.error.data,
      });
      let revertMessage = '';
      if (decodedError) {
        if (decodedError.args && decodedError?.args[0]) {
          revertMessage = decodedError.args[0] as string;

          if (revertMessage) errMsg = revertMessage;
        }
        if (decodedError.errorName) errMsg = `${decodedError.errorName}: ${revertMessage}`;
      }
    } catch (err) {
      /* empty */
    }
  }
  return {
    status: STATUS.error,
    errMsg,
    error,
  };
};
