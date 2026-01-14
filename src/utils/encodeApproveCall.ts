import type { Address } from 'viem';
import { encodeFunctionData } from 'viem';

import { erc20Abi } from '../artifacts';
import { ERC20_FUNCTIONS } from '../constants/erc20';
import type { HexString } from '../types';

export function encodeApproveCallData({ spender, amount }: { spender: Address; amount: bigint }): HexString {
  return encodeFunctionData({
    abi: erc20Abi,
    functionName: ERC20_FUNCTIONS.approve,
    args: [spender, amount],
  });
}
