import { QuoteRateRequest, SwapParamRequest } from "../types";
export declare const fetchQuoteRate: (request: QuoteRateRequest[], chainId: number) => Promise<any>;
export declare const fetchSwapParams: (request: SwapParamRequest[], chainId: number, via?: string) => Promise<any>;
export declare const fetchAllSupportedChains: (chainId: number) => Promise<any>;
