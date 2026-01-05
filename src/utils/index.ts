export { getPublicClient } from './client';

export { readContract, writeContract, estimateGasMultiplier, getDZapAbi, getOtherAbis, multicall } from './contract';

export { generateUUID, getTrxId } from './uuid';

export { isTypeSigner, signTypedData } from './signer';

export { getTokensPairKey, isOneToMany, isDZapNativeToken, isNativeCurrency, isNonEVMChain, getChecksumAddress, formatToken } from './token';

export { encodeApproveCallData } from './approval';

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

export { checkEIP2612PermitSupport, getEIP2612PermitSignature } from './eip-2612';
