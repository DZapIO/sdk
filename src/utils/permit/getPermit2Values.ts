import { HexString } from 'src';
import type { Address } from 'viem';
import { abi as Permit2Abi } from '../../artifacts/Permit2';
import { getPublicClient } from '../index';
import { getNextPermit2Nonce } from './getNextPermit2Nonce';
import { erc20PermitFunctions } from 'src/constants/erc20';
import { permit2PrimaryType } from 'src/constants/permit';
import {
  BasePermitParams,
  TokenWithBigIntAndIndex,
  Permit2PrimaryType,
  PermitBatchTransferFromValues,
  PermitSingleValues,
  PermitTransferFromValues,
} from 'src/types/permit';

type Permit2ValuesParams = {
  deadline: bigint;
  permit2Address: HexString;
  tokens: TokenWithBigIntAndIndex[];
  expiration?: bigint;
  firstTokenNonce: bigint | null;
  primaryType: Permit2PrimaryType;
} & Omit<BasePermitParams, 'deadline' | 'signer'>;

export const getPermitSingleValues = async ({
  spender,
  deadline,
  chainId,
  rpcUrls,
  account,
  expiration,
  token,
  permit2Address,
}: {
  spender: Address;
  deadline: bigint;
  chainId: number;
  account: HexString;
  expiration: bigint;
  token: {
    address: HexString;
    amount: bigint;
    index: number;
  };
  permit2Address: HexString;
  rpcUrls?: string[];
}): Promise<{ permit2Values: PermitSingleValues; nonce: bigint }> => {
  const publicClient = getPublicClient({ chainId, rpcUrls });
  const nonceResult = await publicClient.readContract({
    address: permit2Address,
    abi: Permit2Abi,
    functionName: erc20PermitFunctions.allowance,
    args: [account, token.address, spender],
  });
  return {
    permit2Values: {
      details: {
        token: token.address,
        amount: token.amount,
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
  token,
  permit2Address,
  firstTokenNonce,
}: {
  spender: Address;
  deadline: bigint;
  chainId: number;
  account: HexString;
  token: {
    address: HexString;
    amount: bigint;
    index: number;
  };
  permit2Address: HexString;
  firstTokenNonce: bigint | null;
  rpcUrls?: string[];
}): Promise<{ permit2Values: PermitTransferFromValues; nonce: bigint }> => {
  let nonce;
  if (token.index == 0) {
    nonce = await getNextPermit2Nonce(permit2Address, account, chainId, rpcUrls);
  } else if (firstTokenNonce == null) {
    //don't use !firstTokenNonce because !0n -> true
    throw new Error(`Unable to find nonce for token:${token.address} for PermitTransferFrom`);
  } else {
    nonce = BigInt(firstTokenNonce) + BigInt(token.index);
  }
  return {
    permit2Values: {
      permitted: {
        token: token.address,
        amount: token.amount,
      },
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
  tokens,
}: {
  spender: Address;
  deadline: bigint;
  chainId: number;
  account: HexString;
  permit2Address: HexString;
  tokens: {
    address: HexString;
    amount: bigint;
    index: number;
  }[];
  rpcUrls?: string[];
}): Promise<{ permit2Values: PermitBatchTransferFromValues; nonce: bigint }> => {
  const nonce = await getNextPermit2Nonce(permit2Address, account, chainId, rpcUrls);
  return {
    permit2Values: {
      permitted: tokens.map((token) => ({
        token: token.address,
        amount: token.amount,
      })),
      spender,
      nonce,
      deadline,
    },
    nonce,
  };
};

export async function getPermit2Values(
  params: Permit2ValuesParams,
): Promise<{ permit2Values: PermitTransferFromValues | PermitBatchTransferFromValues | PermitSingleValues; nonce: bigint }> {
  switch (params.primaryType) {
    case permit2PrimaryType.PermitSingle:
      if (!params.expiration) {
        throw new Error('Expiration is required for PermitSingle');
      }
      return getPermitSingleValues({ ...params, token: params.tokens[0], expiration: params.expiration });
    case permit2PrimaryType.PermitWitnessTransferFrom:
      return getPermitTransferFromValues({ ...params, token: params.tokens[0] });
    case permit2PrimaryType.PermitBatchWitnessTransferFrom:
      return getPermitBatchTransferFromValues(params);
    default:
      throw new Error(`Invalid permit type: ${params.primaryType}`);
  }
}
