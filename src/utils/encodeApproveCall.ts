import { Address, encodeFunctionData } from 'viem';
import { ERC20_FUNCTIONS } from '../constants/erc20';
import { HexString } from '../types';
import { erc20Abi } from '../artifacts';

export function encodeApproveCallData({ spender, amount }: { spender: Address; amount: bigint }): HexString {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: ERC20_FUNCTIONS.approve,
    args: [spender, amount],
  });
}
