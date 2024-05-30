import { MaxAllowanceExpiration, MaxAllowanceTransferAmount, MaxSigDeadline, MaxUint256 } from '@uniswap/permit2-sdk';
import { DEFAULT_PERMIT_DATA, NATIVE_TOKEN_ADDRESS, PERMIT2_ADDRESS, PERMIT_TYPEHASH_CONST } from 'src/constants';
import {
  ConnectorType,
  Erc20Functions,
  Erc20PermitFunctions,
  PermitFunctionSelector,
  PermitSelector,
  PermitType,
  StatusCodes,
  TxnStatus,
} from 'src/enums';
import { HexString } from 'src/types';
import { Abi, encodeAbiParameters, erc20Abi, hexToNumber, parseAbiParameters, slice } from 'viem';
import { abi as PermitAbi } from '../artifacts/ERC20Permit';
import { abi as Permit2Abi } from '../artifacts/Permit2';
import { getWalletClient, initializeReadOnlyProvider, readContract, writeContract } from './index';

export const getPermit1PermitData = async ({
  chainId,
  account,
  token,
  dzapContractAddress,
  amount,
  connectorType,
  wcProjectId,
  rpcProvider,
}: {
  chainId: number;
  account: HexString;
  token: HexString;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  rpcProvider: string;
  dzapContractAddress: HexString;
}) => {
  try {
    const name = (await readContract({
      chainId,
      contractAddress: token as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.name,
      rpcProvider,
    })) as string;
    const userNonce = (await readContract({
      chainId,
      contractAddress: token,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.nonces,
      rpcProvider,
      args: [account],
    })) as string;
    let version: string;
    try {
      version = (await readContract({
        chainId,
        contractAddress: token,
        abi: PermitAbi as Abi,
        functionName: Erc20PermitFunctions.version,
        rpcProvider,
      })) as string;
    } catch (e) {
      console.log({ e });
      version = '1';
    }
    const domain = { name: name, version: version, chainId, verifyingContract: token };
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };
    const value = {
      owner: account,
      spender: dzapContractAddress,
      value: BigInt(amount),
      nonce: userNonce,
      deadline: BigInt(MaxSigDeadline.toString()),
    };

    const walletClient = await getWalletClient({ chainId, account, connectorType, wcProjectId });
    const signature = await walletClient.signTypedData({
      account: account,
      domain,
      types,
      primaryType: 'Permit',
      message: value,
    });

    const [r, s, v] = [slice(signature, 0, 32), slice(signature, 32, 64), hexToNumber(slice(signature, 64, 65))];
    const signatureData = encodeAbiParameters(parseAbiParameters('address, address, uint256, uint256, uint8, bytes32, bytes32'), [
      account,
      dzapContractAddress,
      BigInt(amount),
      BigInt(MaxSigDeadline.toString()),
      v,
      r,
      s,
    ]);
    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, signatureData]);
    return { permitData, status: TxnStatus.success, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, permitData: null };
    }
    return { status: TxnStatus.error, code: StatusCodes.Error, permitData: null };
  }
};

export async function getPermit2SignatureAndCalldataForApprove({
  chainId,
  dzapContractAddress,
  account,
  token,
  connectorType,
  wcProjectId,
  rpcProvider,
  amount = BigInt(MaxAllowanceTransferAmount.toString()),
  sigDeadline = BigInt(MaxSigDeadline.toString()),
  expiration = BigInt(MaxAllowanceExpiration.toString()),
}: {
  chainId: number;
  account: string;
  token: string;
  dzapContractAddress: string;
  wcProjectId: string;
  connectorType: ConnectorType;
  rpcProvider: string;
  sigDeadline?: bigint;
  amount?: bigint;
  expiration?: bigint;
}) {
  try {
    const nonce = await readContract({
      chainId,
      contractAddress: PERMIT2_ADDRESS as HexString,
      abi: Permit2Abi as Abi,
      functionName: Erc20PermitFunctions.allowance,
      args: [account, token, dzapContractAddress],
      rpcProvider,
    });
    const PERMIT2_DOMAIN_NAME = 'Permit2';
    const domain = { chainId, name: PERMIT2_DOMAIN_NAME, verifyingContract: PERMIT2_ADDRESS as `0x${string}` };

    const permitApprove = {
      details: {
        token,
        amount,
        expiration,
        nonce: nonce[2],
      },
      spender: dzapContractAddress,
      sigDeadline,
    };
    const types = {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    };
    const values = permitApprove;
    const walletClient = await getWalletClient({ chainId, account: account as HexString, connectorType: connectorType, wcProjectId });
    const signature = await walletClient.signTypedData({
      account: account as HexString,
      domain,
      message: values,
      primaryType: 'PermitSingle',
      types,
    });
    const customPermitDataForTransfer = encodeAbiParameters(
      parseAbiParameters('uint160 allowanceAmount, uint48 nonce, uint48 expiration, uint256 sigDeadline, bytes signature'),
      [
        BigInt(permitApprove.details.amount.toString()),
        Number(permitApprove.details.nonce.toString()),
        Number(permitApprove.details.expiration.toString()),
        BigInt(permitApprove.sigDeadline.toString()),
        signature,
      ],
    );
    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT2_APPROVE, customPermitDataForTransfer]);
    return { status: TxnStatus.success, permitData, code: StatusCodes.Success };
  } catch (e) {
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, errorCode: StatusCodes.UserRejectedRequest, permitdata: null };
    }
    return { status: TxnStatus.error, code: e.code, permitData: null };
  }
}

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
}) => {
  const permitData = DEFAULT_PERMIT_DATA;
  if (srcToken === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
    return { status: TxnStatus.success, permitData };
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
      return { status: TxnStatus.success, permitData, code: StatusCodes.Success };
    }
    return { status: TxnStatus.checkOtherPermit, permitData, code: StatusCodes.CheckOtherPermit };
  } catch (e) {
    console.log({ e });
    return { status: TxnStatus.error, code: e?.code, permitData: null };
  }
};

export const checkPermit1 = async ({
  srcToken,
  chainId,
  rpcProvider,
}: {
  srcToken: string;
  dzapContractAddress: HexString;
  userAddress: string;
  chainId: number;
  rpcProvider: string;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
}) => {
  console.log('checking with permit1');
  try {
    const PERMIT_TYPEHASH = (await initializeReadOnlyProvider({ chainId, rpcProvider }).readContract({
      address: srcToken as HexString,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.PERMIT_TYPEHASH,
    })) as string;
    if (PERMIT_TYPEHASH.toLowerCase() !== PERMIT_TYPEHASH_CONST.toLowerCase()) {
      // eip712 type hash
      throw new Error('Permit type hash is incorrect');
    }
  } catch (e) {
    console.log({ e });
    return { status: TxnStatus.checkOtherPermit, code: StatusCodes.FunctionNotFound, permitData: null };
  }
};

export const checkPermit2 = async ({
  srcToken,
  userAddress,
  chainId,
  rpcProvider,
  amount,
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
  try {
    console.log('checking with permit2');
    const permitAllowance = (await readContract({
      chainId,
      contractAddress: srcToken as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.allowance,
      args: [userAddress, PERMIT2_ADDRESS],
      rpcProvider,
    })) as bigint;
    if (permitAllowance < BigInt(amount)) {
      const txnDetails = await writeContract({
        chainId,
        contractAddress: srcToken as HexString,
        abi: erc20Abi,
        functionName: Erc20Functions.approve,
        args: [PERMIT2_ADDRESS, MaxUint256],
        userAddress: userAddress as HexString,
        rpcProvider,
        connectorType,
        wcProjectId,
      });
      await afterPermit2ApprovalTxnCallback({ txnHash: txnDetails.txnHash });
      if (txnDetails.status !== TxnStatus.success) {
        return {
          status: txnDetails.status,
          code: txnDetails?.code || StatusCodes.FunctionNotFound,
        };
      }
    }
    return { status: TxnStatus.success, code: StatusCodes.Success };
    // console.log('in permit 2 allwance check done');
    // const permitData = await getPermit2SignatureAndCalldataForApprove({
    //   chainId,
    //   dzapContractAddress,
    //   userAddress: userAddress as HexString,
    //   token: srcToken as HexString,
    //   connectorType,
    //   wcProjectId,
    //   rpcProvider,
    // });
  } catch (e) {
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, errorCode: StatusCodes.UserRejectedRequest, permitdata: null };
    }
    return { status: TxnStatus.error, code: e.code, permitData: null };
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
    const { status, permitData, code } = await permitFunctionSelector(functionSelector)({
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
      return { status, code, permitData, permitUsed: PermitSelector };
    } else if (status === TxnStatus.checkOtherPermit) {
      // So, we move to next functionSelector.
      continue;
    } else {
      // Rejected status is only when the user has rejected the transaction
      // Or the permit2 transaction is rejected by the chain.
      // Else there is some other error, possibly couldn't generate signature.
      // Or RPC down.
      return { status, code, permitData: null, permitUsed: functionSelector };
    }
  }
};

export const getPermitData = async ({
  srcToken,
  dzapContractAddress,
  userAddress,
  chainId,
  rpcProvider,
  amount,
  wcProjectId,
  connectorType,
}: {
  srcToken: string;
  dzapContractAddress: HexString;
  userAddress: string;
  chainId: number;
  rpcProvider: string;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
}) => {
  for (let functionSelector = 0; functionSelector <= 2; functionSelector++) {
    const { status, permitData, code } = await permitFunctionSelector(functionSelector)({
      chainId,
      srcToken,
      amount,
      rpcProvider,
      userAddress: userAddress as HexString,
      dzapContractAddress,
      connectorType,
      wcProjectId,
    });
    if (status === TxnStatus.success) {
      // permit was found, so now move to next srcToken
      return { status, code, permitData, permitUsed: functionSelector };
    } else if (status === TxnStatus.checkOtherPermit) {
      // Failed status is when the permit function is not found.
      // So, we move to next functionSelector.
      continue;
    } else {
      // Rejected status is only when the user has rejected the transaction
      // Or the permit2 transaction is rejected by the chain.
      // Else there is some other error, possibly couldn't generate signature.
      // Or RPC down.
      return { status, code, permitData: null, permitUsed: functionSelector };
    }
  }
};
