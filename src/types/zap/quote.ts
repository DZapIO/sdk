import { ZapBuildTxnResponse, ZapBuildTxnRequest } from './build';

export type ZapQuoteResponse = Omit<ZapBuildTxnResponse, 'steps'>;

export type ZapQuoteRequest = Omit<ZapBuildTxnRequest, 'refundee' | 'recipient' | 'account'> &
  Partial<{
    refundee: string;
    recipient: string;
    account: string;
  }>;
