export { getPublicClient } from './client';

export { readContract, writeContract, estimateGasMultiplier, getDZapAbi, getOtherAbis, multicall, handleDecodeTxnData } from './contract';

export { generateUUID, getTrxId } from './uuid';

export { isTypeSigner, signTypedData } from './signer';

export {
  getTokensPairKey,
  isOneToMany,
  isDZapNativeToken,
  isNativeCurrency,
  sortByBalanceInUsd,
  updateTokenListPrices,
  isNonEVMChain,
  getChecksumAddress,
  formatToken,
  approveToken,
  batchGetAllowances,
  getAllowance,
  encodeApproveCallData,
} from './token';

export {
  calcTotalSrcTokenAmount,
  calculateAmountUSD,
  calculateNetGasFeeUsd,
  calculateNetAmountUsd,
  calculateNetGasFee,
  updateFee,
  updatePath,
} from './amount';

export { generateDeadline } from './date';

export { invoke, invokeZap } from './axios';

export {
  BRIDGE_ERRORS,
  getErrorName,
  getRevertMsg,
  isAxiosError,
  handleViemTransactionError,
  isAtomicReadyWalletRejectedUpgradeError,
} from './errors';

export { updateQuotes } from './quotes';

export { SwapInputDataDecoder } from './decoder/swap/inputDataDecoder';

export { checkEIP2612PermitSupport, getEIP2612PermitSignature } from './eip-2612';

export { batchApproveTokens } from './eip-5792/batchApproveTokens';
export { sendBatchCalls, type BatchCallParams } from './eip-5792/sendBatchCalls';
export { waitForBatchTransactionReceipt } from './eip-5792/waitForBatchTransactionReceipt';

export { getPermit2Address, getPermit2Signature } from './permit2';

export { signCustomTypedData } from './signIntent/custom';
export { signGaslessDzapUserIntent } from './signIntent/gasless';
