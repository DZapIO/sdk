import { Signer } from 'ethers';
import { createPublicClient, getAddress, http, ParseEventLogsReturnType, stringToHex, Abi, parseEventLogs, TransactionReceipt } from 'viem';
import * as allWagmiChains from 'viem/chains';
import { Chains, batchSwapIntegrators, defaultBridgeVersion, defaultSwapVersion } from '../config';
import { HexString, ValidAbis } from '../types';
import * as ABI from '../artifacts';

export const wagmiChainsById: Record<number, allWagmiChains.Chain> = Object.values(allWagmiChains).reduce((acc, chainData) => {
  return chainData.id
    ? {
        ...acc,
        [chainData.id]: chainData,
      }
    : acc;
}, {});

export const getChecksumAddress = (address: string): HexString => getAddress(address);

export const purgeSwapVersion = (version?: string) => version || defaultSwapVersion;

export const purgeBridgeVersion = (version?: string) => version || defaultBridgeVersion;

export const initializeReadOnlyProvider = ({ chainId, rpcProvider }: { rpcProvider: string; chainId: number }) => {
  return createPublicClient({
    chain: Chains[chainId],
    transport: http(rpcProvider),
  });
};

export const getIntegratorInfo = (integrator?: string) => batchSwapIntegrators[integrator] || batchSwapIntegrators.dZap;

export const generateUUID = () => {
  let d = new Date().getTime();
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxxx-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxx-xxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  const uuidInBytes = stringToHex(uuid, { size: 32 });
  return uuidInBytes;
};

export const getTrxId = (account: string) => {
  const uuid = `${account.slice(0, 6)}...${account.slice(36, 42)}-${Date.now()}`;
  console.log(uuid);

  const uuidInBytes = stringToHex(uuid, { size: 32 });
  return uuidInBytes;
};

export const estimateGasMultiplier = BigInt(15) / BigInt(10); // .toFixed(0);

export const isTypeSigner = (variable): variable is Signer => {
  return variable instanceof Signer;
};

export const handleDecodeTrxData = (data: TransactionReceipt, abiName: ValidAbis) => {
  let events: ParseEventLogsReturnType<Abi, undefined, true, any> = [];
  try {
    events = parseEventLogs({
      abi: ABI[abiName],
      logs: data.logs,
    });
  } catch (e) {
    events = [];
  }
  events = events?.filter((item: any) => item !== null);

  const swapInfo = Array.isArray(events) && events.length > 0 ? (events[0]?.args as { swapInfo: unknown })?.swapInfo : [];

  return swapInfo;
};
