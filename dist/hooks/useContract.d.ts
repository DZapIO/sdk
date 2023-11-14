import { BigNumber, Signer } from "ethers";
import { SwapParamRequest } from "src/types";
export declare const estimateGasMultiplier: BigNumber;
declare function useContract({ chainId, provider, clientId, }: {
    chainId: number;
    provider: Signer;
    clientId?: number;
}): {
    swap: ({ request, recipient, integrator, version, }: {
        request: SwapParamRequest[];
        recipient: string;
        integrator?: string;
        version?: string;
    }, trxSpeed?: "low" | "medium" | "high") => Promise<any>;
    getContractAddress: (version?: string) => string;
    getContract: (version?: string) => any;
};
export default useContract;
