import { QuoteRateRequest, SwapParamRequest } from "src/types";
declare function useClient({ chainId }: {
    chainId: number;
}): {
    getQuoteRate: (request: QuoteRateRequest[]) => Promise<any>;
    getSwapParams: (request: SwapParamRequest[], via?: string) => Promise<any>;
    getAllSupportedChains: () => Promise<any>;
};
export default useClient;
