import { providers, Signer } from "ethers";

export type Constructor = {
  clientId?: number;
  nftId?: number;
  chainId: number;
  provider: providers.Provider | Signer;
};
