import { DEFAULT_PERMIT_DATA, PERMIT2_APPROVE_DATA, dZapNativeTokenFormat } from 'src/constants';
import { PermitFunctionSelector, PermitSelector, StatusCodes, TxnStatus } from 'src/enums';
import { HexString, PermitSelectorData } from 'src/types';
import { WalletClient, maxUint256 } from 'viem';
import { checkPermit1, getPermit1PermitData } from './permit1Methods';
import { checkPermit2, getPermit2PermitDataForApprove } from './permit2Methods';

const getPermitSelector = (permitUsed: PermitSelector) => {
  let permitSelector = PermitSelector.DefaultPermit;
  if (permitUsed === PermitSelector.Permit1) {
    permitSelector = PermitSelector.Permit1;
  } else if (permitUsed === PermitSelector.Permit2) {
    permitSelector = PermitSelector.Permit2Approve;
  }
  return permitSelector;
};

export const nativeTokenCheck = async ({ srcToken }: { srcToken: string }) => {
  if (srcToken === dZapNativeTokenFormat) {
    return { status: TxnStatus.success, data: { permitAllowance: maxUint256 } };
  }
  return { status: TxnStatus.checkOtherPermit, code: StatusCodes.CheckOtherPermit, data: { permitAllowance: BigInt(0) } };
};

export const permitFunctionSelector = (functionSelector: number) => {
  switch (functionSelector) {
    case PermitFunctionSelector.checkNativeToken:
      return nativeTokenCheck;
    case PermitFunctionSelector.checkPermit1:
      return checkPermit1;
    case PermitFunctionSelector.checkPermit2:
      return checkPermit2;
  }
};

export const getAllowanceAndTokenPermit = async ({
  chainId,
  srcToken,
  userAddress,
  rpcUrls,
}: {
  srcToken: string;
  userAddress: string;
  chainId: number;
  rpcUrls?: string[];
}) => {
  for (let functionSelector = 0; functionSelector <= 2; functionSelector++) {
    const { status, code, data } = await permitFunctionSelector(functionSelector)({
      chainId,
      srcToken,
      rpcUrls,
      userAddress: userAddress as HexString,
    });
    const permitSelector = getPermitSelector(functionSelector);
    if (status === TxnStatus.success) {
      // permit was found, so now move to next srcToken
      return { status, code, data: { permitSelector, permitAllowance: data.permitAllowance } };
    } else if (status === TxnStatus.checkOtherPermit) {
      // move to next permitSelector.
      continue;
    } else {
      // Rejected status is only when the user has rejected the transaction
      // Or the permit2 transaction is rejected by the chain.
      // Else there is some other error, possibly couldn't generate signature.
      // Or RPC down.
      return { status, code, data: { permitSelector, permitAllowance: data.permitAllowance } };
    }
  }
};

export const getPermitDetails = async ({
  permitSelectorData,
  chainId,
  sender,
  srcToken,
  dzapContractAddress,
  amount,
  signer,
  rpcUrls,
}: {
  permitSelectorData: PermitSelectorData;
  chainId: number;
  sender: string;
  srcToken: string;
  dzapContractAddress: HexString;
  amount: string;
  signer: WalletClient;
  rpcUrls?: string[];
}) => {
  switch (permitSelectorData.permitSelector) {
    case PermitSelector.DefaultPermit:
      return { permitData: DEFAULT_PERMIT_DATA, status: TxnStatus.success, code: StatusCodes.Success };
    case PermitSelector.Permit1: {
      return await getPermit1PermitData({
        chainId,
        account: sender as HexString,
        token: srcToken as HexString,
        dzapContractAddress,
        amount,
        signer,
        rpcUrls,
      });
    }
    case PermitSelector.Permit2: {
      return await getPermit2PermitDataForApprove({
        chainId,
        account: sender as HexString,
        token: srcToken as HexString,
        dzapContractAddress,
        amount: BigInt(amount),
        signer,
        rpcUrls,
      });
    }
    case PermitSelector.Permit2Approve: {
      return { permitData: PERMIT2_APPROVE_DATA, status: TxnStatus.success, code: StatusCodes.Success };
    }
    default:
      throw new Error('Invalid permit selector');
  }
};
