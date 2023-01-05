import { ethers } from "ethers";

export const getChecksumAddress = (address: string) =>
  ethers.utils.getAddress(address);
