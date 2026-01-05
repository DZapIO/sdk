import { Abi, WalletClient } from 'viem';
import { HexString } from '../types';
import { StatusCodes, TxnStatus } from '../enums';
import { getPublicClient } from './client';

/**
 * Reads data from a smart contract
 * @param chainId - The chain ID where the contract is deployed
 * @param contractAddress - The address of the contract
 * @param abi - The ABI of the contract
 * @param functionName - The function to call
 * @param rpcUrls - Optional array of RPC URLs
 * @param args - Optional array of function arguments
 * @returns Result object with data, status, and code
 */
export const readContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  rpcUrls,
  args = [],
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  rpcUrls?: string[];
  args?: unknown[];
}) => {
  try {
    const result = await getPublicClient({ chainId, rpcUrls }).readContract({
      address: contractAddress,
      abi,
      functionName,
      args,
    });
    return { data: result, status: TxnStatus.success, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    return { status: TxnStatus.error, code: e.code || StatusCodes.Error };
  }
};

/**
 * Writes data to a smart contract
 * @param chainId - The chain ID where the contract is deployed
 * @param contractAddress - The address of the contract
 * @param abi - The ABI of the contract
 * @param functionName - The function to call
 * @param args - Optional array of function arguments
 * @param value - Optional value to send with the transaction
 * @param rpcUrls - Optional array of RPC URLs
 * @param signer - The wallet client to sign the transaction
 * @returns Result object with transaction hash, status, and code
 */
export const writeContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  args = [],
  value = '0',
  rpcUrls = [],
  signer,
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  args?: unknown[];
  value?: string;
  rpcUrls?: string[];
  signer: WalletClient;
}) => {
  const publicClient = getPublicClient({ chainId, rpcUrls });
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      account: signer.account,
      value: BigInt(value),
    });
    const hash = await signer.writeContract(request);
    return { txnHash: hash, status: TxnStatus.success, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    if (e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: e?.code, txnHash: '' };
    }
    return { status: TxnStatus.error, code: e?.code, txnHash: '' };
  }
};

/**
 * Gas estimation multiplier for transactions
 */
export const estimateGasMultiplier = BigInt(15) / BigInt(10);
