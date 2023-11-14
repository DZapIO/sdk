import { ContractInterface } from "ethers";
export declare const baseUrl = "https://dzap-staging-v2-lqtpzlbt3q-lz.a.run.app/";
export interface DeFiContract {
    [key: string]: {
        abi: ContractInterface;
        [key: number]: string;
    };
}
export declare const defaultSwapVersion = "v2";
export declare const SWAP_CONTRACTS: DeFiContract;
export declare const batchSwapIntegrators: {
    [key: string]: {
        contract: string;
    };
};
