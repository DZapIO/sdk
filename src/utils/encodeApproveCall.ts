import { erc20Abi } from 'src/artifacts';
import { erc20Functions } from 'src/constants/erc20';
import { HexString } from 'src/types';
import { Address, encodeFunctionData } from 'viem';

export function encodeApproveCallData({ spender, amount }: { spender: Address; amount: bigint }): HexString {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: erc20Functions.approve,
    args: [spender, amount],
  });
}
