import {
  Chains,
  batchSwapIntegrators,
  defaultSwapVersion,
} from 'src/config';
import { JSON_RPC_PROVIDER } from 'src/constants';
import { HexString } from 'src/types';
import { createPublicClient, getAddress, http, stringToHex } from 'viem';

export const getChecksumAddress = (address: string): HexString =>
  getAddress(address);

export const purgeSwapVersion = (version?: string) =>
  version || defaultSwapVersion;

export const initializeReadOnlyProvider = (chainId: number) => {
  if (JSON_RPC_PROVIDER[chainId]) {
    return createPublicClient({
      chain: Chains[chainId],
      transport: http(JSON_RPC_PROVIDER[chainId]),
    });
  }
  const client = createPublicClient({
    transport: http(),
  });
  return client;
};

export const getIntegratorInfo = (integrator?: string) =>
  batchSwapIntegrators[integrator] || batchSwapIntegrators.dZap;

export const generateUUID = () => {
  let d = new Date().getTime();
  let d2 =
    (typeof performance !== 'undefined' &&
      performance.now &&
      performance.now() * 1000) ||
    0;
  const uuid =
    'xxxxxxxx-xxxx-4xxx-yxxxx-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxx-xxxxxxxx'.replace(
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
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      },
    );
  const uuidInBytes = stringToHex(uuid, { size: 32 });
  return uuidInBytes;
};

export const getTrxId = (account: string) => {
  const uuid = `${account.slice(0, 6)}...${account.slice(
    36,
    42,
  )}-${Date.now()}`;
  console.log(uuid);

  const uuidInBytes = stringToHex(uuid, { size: 32 });
  return uuidInBytes;
};
