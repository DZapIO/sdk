import { TxnStatus } from '../..';

/** Signed, serialised transaction — broadcast on-chain by DZap. */
export type ZapOnChainBroadcastTxData = string;

/** Signed order handed to an off-chain provider (a 1inch limit order, for instance). */
export type ZapProviderBroadcastTxData = {
  payload: unknown;
};

export type ZapBroadcastTxData = ZapOnChainBroadcastTxData | ZapProviderBroadcastTxData;

/**
 * `providerId` and the shape of `txData` move together: set `providerId` and `txData` must be an
 * object, omit it and `txData` must be a string. The backend rejects any other combination.
 */
export type ZapBroadcastTxParams = {
  txId: string;
  chainId: number;
  txData: ZapBroadcastTxData;
  providerId?: string;
};

export type ZapBroadcastResult = {
  txnHash: string;
  txnId: string;
  additionalInfo?: Record<string, unknown>;
};

export type BroadcastZapTxSuccessResponse = {
  status: TxnStatus.success;
  data: ZapBroadcastResult;
};

export type BroadcastZapTxErrorResponse = {
  status: TxnStatus.error;
  data: {
    message: string;
  };
};

export type BroadcastZapTxResponse = BroadcastZapTxSuccessResponse | BroadcastZapTxErrorResponse;

export type ZapBroadcastTxResult =
  | ({
      status: TxnStatus.success;
    } & ZapBroadcastResult)
  | {
      status: Exclude<TxnStatus, TxnStatus.success>;
      message: string;
    };
