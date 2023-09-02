import { ethers, providers } from "ethers";
import { batchSwapIntegrators, defaultSwapVersion } from "src/config";
import { JSON_RPC_PROVIDER } from "src/constants";
import { Provider } from "zksync-web3";

export const getChecksumAddress = (address: string) =>
  ethers.utils.getAddress(address);

export const purgeSwapVersion = (version?: string) =>
  version || defaultSwapVersion;

export const initializeReadOnlyProvider = (chainId: number) => {
  if (chainId === 324) {
    return new Provider(JSON_RPC_PROVIDER[chainId]);
  }
  if (JSON_RPC_PROVIDER[chainId]) {
    return new providers.JsonRpcProvider(JSON_RPC_PROVIDER[chainId]);
  }
  return providers.getDefaultProvider();
};

export const getIntegratorInfo = (integrator?: string) =>
  batchSwapIntegrators[integrator] || batchSwapIntegrators.dZap;
