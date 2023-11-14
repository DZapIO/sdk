export declare const formatFeeHistory: (result: any) => any[];
export declare const getNetworkFee: (chainId: number) => Promise<{
    low: number;
    medium: number;
    high: number;
}>;
