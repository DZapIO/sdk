import { Address, encodeFunctionData } from 'viem';
import { erc20Abi } from '../artifacts';
import { ERC20_FUNCTIONS } from '../constants/erc20';
import { HexString } from '../types';

/**
 * Encodes ERC20 approve function call data
 * @param spender - The address to approve
 * @param amount - The amount to approve
 * @returns Encoded function call data
 */
export function encodeApproveCallData({ spender, amount }: { spender: Address; amount: bigint }): HexString {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: ERC20_FUNCTIONS.approve,
    args: [spender, amount],
  });
}
