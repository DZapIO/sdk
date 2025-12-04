import { Signer } from 'ethers';
import { encodeFunctionData, maxUint256, MulticallParameters, WalletClient } from 'viem';
import { isDZapNativeToken, isTypeSigner, writeContract } from '.';
import { erc20Abi } from '../artifacts';
import { ApprovalModes } from '../constants/approval';
import { erc20Functions } from '../constants/erc20';
import { StatusCodes, TxnStatus } from '../enums';
import { ApprovalMode, HexString, TokenPermitData } from '../types';
import { checkEIP2612PermitSupport } from './eip-2612/eip2612Permit';
import { multicall } from './multicall';
import { getPermit2Address } from './permit2';

type AllowanceParams = {
  chainId: number;
  sender: HexString;
  tokens: { address: HexString; amount: string; permit?: TokenPermitData }[];
  spender: HexString;
  rpcUrls?: string[];
  mode?: ApprovalMode;
  multicallAddress?: HexString;
};

export const approveToken = async ({
  chainId,
  signer,
  rpcUrls,
  mode,
  tokens,
  approvalTxnCallback,
  spender,
}: {
  chainId: number;
  signer: WalletClient | Signer;
  mode: ApprovalMode;
  tokens: { address: HexString; amount: string }[];
  rpcUrls?: string[];
  approvalTxnCallback?: ({
    txnDetails,
    address,
  }: {
    txnDetails: { txnHash: string; code: StatusCodes; status: TxnStatus };
    address: HexString;
  }) => Promise<TxnStatus | null>;
  spender: HexString;
}) => {
  if (mode !== ApprovalModes.Default) {
    spender = getPermit2Address(chainId);
  }
  for (let dataIdx = 0; dataIdx < tokens.length; dataIdx++) {
    let txnDetails = { status: TxnStatus.success, code: StatusCodes.Success, txnHash: '' };
    if (isTypeSigner(signer)) {
      const from = await signer.getAddress();
      const callData = encodeFunctionData({
        abi: erc20Abi,
        functionName: erc20Functions.approve,
        args: [spender, BigInt(tokens[dataIdx].amount)],
      });
      await signer.sendTransaction({
        from,
        chainId,
        to: tokens[dataIdx].address,
        data: callData,
      });
      return {
        status: TxnStatus.success,
        code: StatusCodes.Success,
      };
    } else {
      txnDetails = await writeContract({
        chainId,
        contractAddress: tokens[dataIdx].address,
        abi: erc20Abi,
        functionName: erc20Functions.approve,
        args: [spender, tokens[dataIdx].amount],
        rpcUrls,
        signer,
      });
    }
    if (txnDetails.code !== StatusCodes.Success) {
      return {
        status: txnDetails.status,
        code: txnDetails?.code || StatusCodes.FunctionNotFound,
      };
    }
    if (approvalTxnCallback) {
      const callbackStatus = await approvalTxnCallback({ txnDetails, address: tokens[dataIdx].address });
      if (callbackStatus && callbackStatus !== TxnStatus.success) {
        return {
          status: txnDetails.status,
          code: txnDetails?.code || StatusCodes.Error,
        };
      }
    }
  }
  return { status: TxnStatus.success, code: StatusCodes.Success };
};

/**
 * Batch ERC20 allowance checks using multicall
 */
export const batchGetAllowances = async ({
  chainId,
  data,
  owner,
  multicallAddress,
  rpcUrls,
}: {
  chainId: number;
  data: { token: HexString; spender: HexString }[];
  owner: HexString;
  multicallAddress?: HexString;
  rpcUrls?: string[];
}): Promise<{ status: TxnStatus; code: StatusCodes; data: Record<string, bigint> }> => {
  const contracts: MulticallParameters['contracts'] = data.map(({ token, spender }) => ({
    address: token,
    abi: erc20Abi,
    functionName: erc20Functions.allowance,
    args: [owner, spender],
  }));

  const {
    status,
    code,
    data: allowances,
  } = await multicall({
    chainId,
    contracts,
    rpcUrls,
    multicallAddress,
    allowFailure: false,
  });

  if (status !== TxnStatus.success) {
    return { status, code, data: {} };
  }

  const tokenAllowances: Record<string, bigint> = {};
  for (let i = 0; i < data.length; i++) {
    tokenAllowances[data[i].token] = allowances[i] as bigint;
  }

  return { status, code, data: tokenAllowances };
};

/**
 * Get allowance information for tokens based on approval mode
 */
export const getAllowance = async ({ chainId, sender, tokens, rpcUrls, multicallAddress, mode, spender }: AllowanceParams) => {
  const data: { [key: string]: { allowance: bigint; approvalNeeded: boolean; signatureNeeded: boolean } } = {};

  const nativeTokens = tokens.filter(({ address }) => isDZapNativeToken(address));
  const erc20Tokens = tokens.filter(({ address }) => !isDZapNativeToken(address));

  const approvalData = await Promise.all(
    erc20Tokens.map(async ({ address, amount, permit }) => {
      if (mode === ApprovalModes.AutoPermit) {
        const eip2612PermitData = await checkEIP2612PermitSupport({
          address,
          chainId,
          rpcUrls,
          owner: sender,
          permit,
        });
        return {
          token: address,
          spender: eip2612PermitData.supportsPermit ? spender : getPermit2Address(chainId), // @dev: not needed, but added for consistency
          amount,
          isEIP2612PermitSupported: eip2612PermitData.supportsPermit,
          isDefaultApprovalMode: false,
        };
      } else if (mode === ApprovalModes.Default) {
        return {
          token: address,
          spender,
          amount,
          isDefaultApprovalMode: true,
        };
      } else {
        const permit2Address = getPermit2Address(chainId);
        return { token: address, spender: permit2Address, amount, isDefaultApprovalMode: false };
      }
    }),
  );

  for (const { address } of nativeTokens) {
    data[address] = { allowance: maxUint256, approvalNeeded: false, signatureNeeded: false };
  }

  if (erc20Tokens.length === 0) {
    return { status: TxnStatus.success, code: StatusCodes.Success, data };
  }
  try {
    const { data: allowances } = await batchGetAllowances({
      chainId,
      data: approvalData,
      owner: sender,
      multicallAddress,
      rpcUrls,
    });

    for (let i = 0; i < approvalData.length; i++) {
      const { token, amount, isEIP2612PermitSupported, isDefaultApprovalMode } = approvalData[i];
      const allowance = isEIP2612PermitSupported ? maxUint256 : allowances[token];
      const approvalNeeded = isEIP2612PermitSupported ? false : allowance < BigInt(amount);
      const signatureNeeded = isDefaultApprovalMode ? false : true;
      data[token] = { allowance, approvalNeeded, signatureNeeded };
    }

    return { status: TxnStatus.success, code: StatusCodes.Success, data };
  } catch (error: any) {
    console.error('Multicall allowance check failed:', error);
    return { status: TxnStatus.error, code: StatusCodes.Error, data };
  }
};
