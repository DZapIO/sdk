import { ethers, providers, utils } from "ethers";
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

export const generateUUID = () => {
  let d = new Date().getTime();
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  const uuid =
    "xxxxxxxx-xxxx-4xxx-yxxxx-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxx-xxxxxxxx".replace(
      /[xy]/g,
      (c) => {
        let r = Math.random() * 16;
        if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  const uuidInBytes = utils.formatBytes32String(uuid);
  return uuidInBytes;
};

export const getTrxId = (account: string) => {
  const uuid = `${account.slice(0, 6)}...${account.slice(
    36,
    42
  )}-${Date.now()}`;
  console.log(uuid);

  const uuidInBytes = utils.formatBytes32String(uuid);
  return uuidInBytes;
};
