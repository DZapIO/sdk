import { ethers } from "ethers";
import DZap from "./../../";
import { registry } from "../../config/registry";

export const VALID_CHAIN_ID = 137;
export const INVALID_CHAIN_ID = 111;

export const getDefaultProvider = () => ethers.getDefaultProvider();

export const createSDKInstance = (chainId: number) =>
  new DZap({
    chainId,
    provider: getDefaultProvider(),
  });

export const getContractAddress = () =>
  ethers.utils.getAddress("0x3af3cc4930ef88F4afe0b695Ac95C230E1A108Ec");

export const getAccount = () => "0x2CB99F193549681e06C6770dDD5543812B4FaFE8";

export const getContract = () =>
  new ethers.Contract(getContractAddress(), registry.abi, getDefaultProvider());

export const getRequest = () => [
  {
    amount: "1000000000000000000",
    fromTokenAddress: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    slippage: 1,
    toTokenAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
];

export const ThrowErrorChainId = () => {
  throw new Error("Unsupported chainId");
};
