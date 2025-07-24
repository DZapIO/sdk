import { HexString } from 'src';
import type { Address } from 'viem';
import { abi as Permit2Abi } from '../../artifacts/Permit2.js';
import { getPublicClient } from '../index.js';
import { getNextPermit2Nonce } from './getNextPermit2Nonce.js';
import { Permit2ValuesParams, PermitBatchTransferFrom, PermitSingle, PermitTransferFrom } from './types.js';
import { erc20PermitFunctions } from 'src/constants/erc20';
import { permit2PrimaryType } from 'src/constants/permit';

export const getPermitSingleValues = async ({
  spender,
  deadline,
  chainId,
  rpcUrls,
  account,
  expiration,
  permitted,
  permit2Address,
}: {
  spender: Address;
  deadline: bigint;
  chainId: number;
  account: HexString;
  expiration: bigint;
  permitted: {
    token: HexString;
    amount: bigint;
  };
  permit2Address: HexString;
  rpcUrls?: string[];
}): Promise<{ permit2Values: PermitSingle; nonce: bigint }> => {
  const publicClient = getPublicClient({ chainId, rpcUrls });
  const nonceResult = await publicClient.readContract({
    address: permit2Address,
    abi: Permit2Abi,
    functionName: erc20PermitFunctions.allowance,
    args: [account, permitted.token, spender],
  });
  return {
    permit2Values: {
      details: {
        token: permitted.token,
        amount: permitted.amount,
        expiration,
        nonce: nonceResult[2],
      },
      spender,
      sigDeadline: deadline,
    },
    nonce: BigInt(nonceResult[2]),
  };
};

export const getPermitTransferFromValues = async ({
  spender,
  deadline,
  chainId,
  rpcUrls,
  account,
  permitted,
  permit2Address,
}: {
  spender: Address;
  deadline: bigint;
  chainId: number;
  account: HexString;
  permitted: {
    token: HexString;
    amount: bigint;
  };
  permit2Address: HexString;
  rpcUrls?: string[];
}): Promise<{ permit2Values: PermitTransferFrom; nonce: bigint }> => {
  const nonce = await getNextPermit2Nonce(permit2Address, account, chainId, rpcUrls);
  return {
    permit2Values: {
      permitted,
      spender,
      nonce,
      deadline,
    },
    nonce,
  };
};

export const getPermitBatchTransferFromValues = async ({
  spender,
  deadline,
  chainId,
  rpcUrls,
  account,
  permit2Address,
  permitted,
}: {
  spender: Address;
  deadline: bigint;
  chainId: number;
  account: HexString;
  permit2Address: HexString;
  permitted: {
    token: HexString;
    amount: bigint;
  }[];
  rpcUrls?: string[];
}): Promise<{ permit2Values: PermitBatchTransferFrom; nonce: bigint }> => {
  const nonce = await getNextPermit2Nonce(permit2Address, account, chainId, rpcUrls);
  console.log('nonce', nonce);
  return {
    permit2Values: {
      permitted,
      spender,
      nonce,
      deadline,
    },
    nonce,
  };
};

export async function getPermit2Values(
  params: Permit2ValuesParams,
): Promise<{ permit2Values: PermitTransferFrom | PermitBatchTransferFrom | PermitSingle; nonce: bigint }> {
  switch (params.primaryType) {
    case permit2PrimaryType.PermitSingle:
      if (!params.expiration) {
        throw new Error('Expiration is required for PermitSingle');
      }
      return getPermitSingleValues({ ...params, permitted: params.permitted[0], expiration: params.expiration });
    case permit2PrimaryType.PermitWitnessTransferFrom:
      return getPermitTransferFromValues({ ...params, permitted: params.permitted[0] });
    case permit2PrimaryType.PermitBatchWitnessTransferFrom:
      return getPermitBatchTransferFromValues(params);
    default:
      throw new Error(`Invalid permit type: ${(params as any).primaryType}`);
  }
}
