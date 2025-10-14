import { Address, encodeFunctionData, erc20Abi } from 'viem';
import { erc20Functions } from '../constants/erc20';
import { HexString } from '../types';

export function encodeApproveCallData({ spender, amount }: { spender: Address; amount: bigint }): HexString {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: erc20Functions.approve,
    args: [spender, amount],
  });
}
