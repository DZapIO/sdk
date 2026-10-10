import { StatusCodes, TxnStatus } from '../enums';

export type TransactionError = { status: Exclude<TxnStatus, TxnStatus.success>; error: any; errorMsg: string; code: StatusCodes };
