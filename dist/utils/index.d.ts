import { ethers } from "ethers";
import { Provider } from "zksync-web3";
export declare const getChecksumAddress: (address: string) => string;
export declare const purgeSwapVersion: (version?: string) => string;
export declare const initializeReadOnlyProvider: (chainId: number) => Provider | ethers.providers.BaseProvider;
export declare const getIntegratorInfo: (integrator?: string) => {
    contract: string;
};
export declare const generateUUID: () => string;
export declare const getTrxId: (account: string) => string;
