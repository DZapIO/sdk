import { TxnStatus } from '../..';

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

export type ExecuteZapSvmBundleParams = {
  chainId: number;
  txnData: { signedTransactionsBase64: string[] };
};

export type ExecuteZapSvmBundleResponse =
  | {
      status: TxnStatus.success;
      data: { txnId: string; txHashes: string[] };
    }
  | {
      status: TxnStatus.error;
      message: string;
      data: { retry: boolean };
    };
