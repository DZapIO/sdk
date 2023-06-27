import { ethers } from "ethers";
import { defaultSwapVersion } from "src/config";

export const getChecksumAddress = (address: string) =>
  ethers.utils.getAddress(address);

export const purgeSwapVersion = (version?: string) =>
  version || defaultSwapVersion;
