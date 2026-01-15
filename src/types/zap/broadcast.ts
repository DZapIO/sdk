import type { TxnStatus } from '../..';

export type BroadcastZapTxSuccessResponse = {
  status: TxnStatus.success;
  data: {
    txnHash: string;
    txnId: string;
  };
};

export type BroadcastZapTxErrorResponse = {
  status: TxnStatus.error;
  data: {
    message: string;
  };
};

export type BroadcastZapTxResponse = BroadcastZapTxSuccessResponse | BroadcastZapTxErrorResponse;
