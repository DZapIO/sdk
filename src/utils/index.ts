import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { Signer } from 'ethers';
import { ConnectorType, StatusCodes, TxnStatus } from 'src/enums';
import { Abi, createPublicClient, createWalletClient, custom, getAddress, http, stringToHex } from 'viem';
import * as allWagmiChains from 'viem/chains';
import { batchSwapIntegrators, defaultBridgeVersion, defaultSwapVersion } from '../config';
import { HexString } from '../types';

type Window = {
  ethereum: any;
};

export const viemchainsById: Record<number, allWagmiChains.Chain> = Object.values(allWagmiChains).reduce((acc, chainData) => {
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
    chain: viemchainsById[chainId],
    transport: http(rpcProvider),
  });
};

const getEthereumProvider = async (connectorType: ConnectorType, chainId: number, wcProjectId: string) => {
  if (connectorType === ConnectorType.walletConnect && wcProjectId) {
    return await EthereumProvider.init({
      projectId: wcProjectId,
      showQrModal: true,
      optionalChains: [chainId],
    });
  }
  return (window as unknown as Window).ethereum!;
};
export const getWalletClient = async ({
  chainId,
  account,
  connectorType,
  wcProjectId,
}: {
  chainId: number;
  account: HexString;
  connectorType: ConnectorType;
  wcProjectId: string;
}) => {
  try {
    const provider = await getEthereumProvider(connectorType, chainId, wcProjectId);
    return createWalletClient({
      chain: viemchainsById[chainId],
      transport: custom(provider),
      account,
    });
  } catch (error) {
    console.log(error);
    throw new Error('Error creating Wallet Client');
  }
};

export const readContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  rpcProvider,
  args = [],
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  rpcProvider: string;
  args?: unknown[];
}) => {
  try {
    return await initializeReadOnlyProvider({ chainId, rpcProvider }).readContract({
      address: contractAddress,
      abi,
      functionName,
      args,
    });
  } catch (e) {
    console.log(e);
  }
};

export const writeContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  args = [],
  userAddress,
  value = '0',
  rpcProvider,
  connectorType,
  wcProjectId,
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  args?: unknown[];
  userAddress: HexString;
  value?: string;
  rpcProvider: string;
  connectorType: ConnectorType;
  wcProjectId: string;
}) => {
  const publicClient = initializeReadOnlyProvider({ chainId, rpcProvider });
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      account: userAddress,
      value,
    });
    const walletClient = await getWalletClient({ chainId, account: userAddress, connectorType, wcProjectId });
    const hash = await walletClient.writeContract(request);
    // wait for block confirmation and return transaction receipt
    const txReceipt = await publicClient.waitForTransactionReceipt({ hash });
    return { ...txReceipt, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    if (e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: e?.code };
    }
    return { status: TxnStatus.error, code: e?.code };
  }
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
