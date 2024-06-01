import { DEFAULT_PERMIT_DATA, NATIVE_TOKEN_ADDRESS, PERMIT2_APPROVE_DATA } from 'src/constants';
import { ConnectorType, Erc20Functions, PermitFunctionSelector, PermitSelector, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { erc20Abi } from 'viem';

import { readContract } from './index';
import { checkPermit1, getPermit1PermitData } from './permit1Methods';
import { checkPermit2, getPermit2PermitDataForApprove } from './permit2Methods';

export const nativeTokenAndAllowanceChecker = async ({
  srcToken,
  dzapContractAddress,
  userAddress,
  chainId,
  rpcProvider,
  amount,
}: {
  srcToken: string;
  dzapContractAddress: HexString;
  userAddress: string;
  chainId: number;
  rpcProvider: string;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  afterPermit2ApprovalTxnCallback?: ({ txnHash }: { txnHash: HexString }) => Promise<void>;
}) => {
  if (srcToken === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
    return { status: TxnStatus.success };
  }
  try {
    const allowance = await readContract({
      chainId,
      contractAddress: srcToken as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.allowance,
      args: [userAddress, dzapContractAddress],
      rpcProvider,
    });
    // @dev allowance is more than required amount, so transact
    if ((allowance as bigint) > BigInt(amount)) {
      return { status: TxnStatus.success, code: StatusCodes.Success };
    }
    return { status: TxnStatus.checkOtherPermit, code: StatusCodes.CheckOtherPermit };
  } catch (e) {
    console.log({ e });
    return { status: TxnStatus.error, code: e?.code };
  }
};

export const permitFunctionSelector = (functionSelector: number) => {
  switch (functionSelector) {
    case PermitFunctionSelector.nativeTokenAndAllowanceCheck:
      return nativeTokenAndAllowanceChecker;
    case PermitFunctionSelector.checkPermit1:
      return checkPermit1;
    case PermitFunctionSelector.checkPermit2:
      return checkPermit2;
  }
};

export const getAllowanceAndTokenPermit = async ({
  chainId,
  srcToken,
  dzapContractAddress,
  userAddress,
  amount,
  rpcProvider,
  connectorType,
  wcProjectId,
  afterPermit2ApprovalTxnCallback,
}: {
  srcToken: string;
  dzapContractAddress: HexString;
  userAddress: string;
  chainId: number;
  rpcProvider: string;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  afterPermit2ApprovalTxnCallback?: ({ txnHash }: { txnHash: HexString }) => Promise<void>;
}) => {
  for (let functionSelector = 0; functionSelector <= 2; functionSelector++) {
    const { status, code } = await permitFunctionSelector(functionSelector)({
      chainId,
      srcToken,
      amount,
      rpcProvider,
      userAddress: userAddress as HexString,
      dzapContractAddress,
      connectorType,
      wcProjectId,
      afterPermit2ApprovalTxnCallback,
    });
    if (status === TxnStatus.success) {
      // permit was found, so now move to next srcToken
      return { status, code, permitUsed: functionSelector };
    } else if (status === TxnStatus.checkOtherPermit) {
      // So, we move to next functionSelector.
      continue;
    } else {
      // Rejected status is only when the user has rejected the transaction
      // Or the permit2 transaction is rejected by the chain.
      // Else there is some other error, possibly couldn't generate signature.
      // Or RPC down.
      return { status, code, permitUsed: functionSelector };
    }
  }
};

export const getPermitDetails = async ({
  permitSelector,
  chainId,
  sender,
  srcToken,
  dzapContractAddress,
  amount,
  connectorType,
  wcProjectId,
  rpcProvider,
}: {
  permitSelector: PermitSelector;
  chainId: number;
  sender: string;
  srcToken: string;
  dzapContractAddress: HexString;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  rpcProvider: string;
}) => {
  switch (permitSelector) {
    case PermitSelector.DefaultPermit:
      return { permitData: DEFAULT_PERMIT_DATA, status: TxnStatus.success, code: StatusCodes.Success };
    case PermitSelector.Permit1: {
      return await getPermit1PermitData({
        chainId,
        account: sender as HexString,
        token: srcToken as HexString,
        dzapContractAddress,
        amount,
        connectorType,
        wcProjectId,
        rpcProvider,
      });
    }
    case PermitSelector.Permit2:
      {
        return await getPermit2PermitDataForApprove({
          chainId,
          account: sender as HexString,
          token: srcToken as HexString,
          dzapContractAddress,
          amount: BigInt(amount),
          connectorType,
          wcProjectId,
          rpcProvider,
        });
      }
      break;
    case PermitSelector.Permit2Approve: {
      return { permitData: PERMIT2_APPROVE_DATA, status: TxnStatus.success, code: StatusCodes.Success };
    }
    default:
      throw new Error('Invalid permit selector');
  }
};
