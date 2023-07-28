import { ContractInterface } from "ethers";
import { abi as swapAbiV1point2 } from "../artifacts/v1.2/DZapAggregator";
import { abi as swapAbiV1point3 } from "../artifacts/v1.3/DZapAggregator";

export const baseUrl = "https://api.dzap.io/";

export interface DeFiContract {
  [key: string]: {
    abi: ContractInterface;
    [key: number]: string;
  };
}

export const defaultSwapVersion = "v1.2";

export const SWAP_CONTRACTS: DeFiContract = {
  "v1.2": {
    1: "0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec",
    137: "0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec",
    56: "0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec",
    42161: "0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec",
    abi: swapAbiV1point2,
  },
  "v1.3": {
    324: "0x244C41d354F8311b68C8B934f2A43EADb93f2E2F",
    10: "0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec",
    abi: swapAbiV1point3,
  },
};
