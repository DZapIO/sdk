import { ZapBuildTxnResponse, ZapBuildTxnRequest } from './build';

export type ZapQuoteResponse = Omit<ZapBuildTxnResponse, 'steps'>;

export type ZapQuoteRequest = ZapBuildTxnRequest;
