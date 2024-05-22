import { MaxSigDeadline, MaxUint256, SignatureTransfer, TokenPermissions } from '@uniswap/permit2-sdk';
import { DEFAULT_PERMIT1_DATA, NATIVE_TOKEN_ADDRESS, PERMIT2_ADDRESS, PERMIT_TYPEHASH_CONST } from 'src/constants';
import { ConnectorType, Erc20Functions, Erc20PermitFunctions, PermitFunctionSelectorCases, PermitType, StatusCodes, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { Abi, encodeAbiParameters, erc20Abi, hexToNumber, parseAbiParameters, slice } from 'viem';
import { abi as PermitAbi } from '../artifacts/ERC20Permit';
import { getWalletClient, initializeReadOnlyProvider, readContract, writeContract } from './index';

export const getPermitSignature = async ({
  chainId,
  account,
  token,
  dzapContractAddress,
  amount,
  name,
  connectorType,
  wcProjectId,
  rpcProvider,
}: {
  chainId: number;
  account: HexString;
  token: HexString;
  amount: string;
  name: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  rpcProvider: string;
  dzapContractAddress: HexString;
}): Promise<{ data: HexString }> => {
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
  console.log({ domain, types, value });
  const signature = await walletClient.signTypedData({
    account: account,
    domain,
    types,
    primaryType: 'Permit',
    message: value,
  });

  const [r, s, v] = [slice(signature, 0, 32), slice(signature, 32, 64), hexToNumber(slice(signature, 64, 65))];
  console.log(signature, v, r, s);
  const data = encodeAbiParameters(parseAbiParameters('address, address, uint256, uint256, uint8, bytes32, bytes32'), [
    account,
    dzapContractAddress,
    BigInt(amount),
    BigInt(MaxSigDeadline.toString()),
    v,
    r,
    s,
  ]);
  console.log({ data });
  return { data };
};

export async function getPermit2SignatureAndCalldataForTransfer({
  chainId,
  dzapContractAddress,
  userAddress,
  contributionTokenAddress,
  nonce,
  amount,
  connectorType,
  wcProjectId,
}: {
  chainId: number;
  dzapContractAddress: HexString;
  userAddress: HexString;
  contributionTokenAddress: HexString;
  nonce: string;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
}) {
  const permit = {
    permitted: {
      token: contributionTokenAddress,
      amount,
    },
    spender: dzapContractAddress,
    nonce,
    deadline: MaxSigDeadline,
  };

  const permitInfo = SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, chainId);

  const domain = {
    name: permitInfo.domain.name,
    chainId: parseInt(permitInfo.domain.chainId?.toString() || '0', 10),
    verifyingContract: permitInfo.domain.verifyingContract as HexString,
  };
  const walletClient = await getWalletClient({ chainId, account: userAddress, connectorType: connectorType, wcProjectId });
  const types = permitInfo.types;
  const permitted = permitInfo.values.permitted as TokenPermissions;
  const signature = await walletClient.signTypedData({
    account: userAddress,
    domain: domain,
    types,
    primaryType: 'PermitTransferFrom',
    message: {
      permitted: {
        token: permitted.token,
        amount: BigInt(permitted.amount.toString()),
      },
      spender: dzapContractAddress,
      nonce: BigInt(permitInfo.values.nonce.toString()),
      deadline: BigInt(permitInfo.values.deadline.toString()),
    },
  });
  // const msgHash = SignatureTransfer.hash(permit, dzapContractAddress, chainId);
  const permitDetails = {
    permitted: {
      token: contributionTokenAddress,
      amount: BigInt(amount),
    },
    nonce,
    deadline: MaxSigDeadline,
  };
  const customPermitDataForTransfer = encodeAbiParameters(parseAbiParameters('uint256 nonce, uint256 deadline, bytes signature'), [
    BigInt(permitDetails.nonce),
    BigInt(permitDetails.deadline.toString()),
    signature,
  ]);
  return encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT2_APPROVE, customPermitDataForTransfer]);
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
  const permitData = DEFAULT_PERMIT1_DATA;
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
  dzapContractAddress,
  userAddress,
  chainId,
  rpcProvider,
  amount,
  connectorType,
  wcProjectId,
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
  try {
    const name = (await readContract({
      chainId,
      contractAddress: srcToken as HexString,
      abi: erc20Abi,
      functionName: Erc20Functions.name,
      rpcProvider,
    })) as string;

    const signatureData = await getPermitSignature({
      chainId,
      account: userAddress as HexString,
      token: srcToken as HexString,
      dzapContractAddress,
      amount,
      name,
      connectorType,
      wcProjectId,
      rpcProvider,
    });
    const permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, signatureData.data]);
    return { status: TxnStatus.success, permitData, code: StatusCodes.Success };
  } catch (e: any) {
    console.log({ e });
    if (e?.cause?.code === StatusCodes.UserRejectedRequest || e?.code === StatusCodes.UserRejectedRequest) {
      return { status: TxnStatus.rejected, code: StatusCodes.UserRejectedRequest, permitData: null };
    }
    return { status: TxnStatus.checkOtherPermit, code: StatusCodes.CheckOtherPermit, permitData: null };
  }
};

export const checkPermit2 = async ({
  srcToken,
  dzapContractAddress,
  userAddress,
  chainId,
  rpcProvider,
  amount,
  connectorType,
  wcProjectId,
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
    console.log({ permitAllowance, amount });
    if (permitAllowance < BigInt(amount)) {
      const txReceipt = await writeContract({
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
      if (txReceipt.status !== TxnStatus.success) {
        return {
          status: txReceipt.status,
          permitData: null,
          code: txReceipt?.code || StatusCodes.FunctionNotFound,
        };
      }
    }
    console.log('in permit 2 without contract');
    const publicClient = initializeReadOnlyProvider({ chainId, rpcProvider });
    const nonce = await publicClient.getTransactionCount({
      address: userAddress as HexString,
    });
    const permitData = await getPermit2SignatureAndCalldataForTransfer({
      chainId,
      dzapContractAddress,
      userAddress: userAddress as HexString,
      contributionTokenAddress: srcToken as HexString,
      nonce: nonce.toString(),
      amount: amount.toString(),
      connectorType,
      wcProjectId,
    });

    return { status: TxnStatus.success, permitData, code: StatusCodes.Success };
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
    case PermitFunctionSelectorCases.nativeTokenAndAllowanceCheck:
      return nativeTokenAndAllowanceChecker;
    case PermitFunctionSelectorCases.checkPermit1:
      return checkPermit1;
    case PermitFunctionSelectorCases.checkPermit2:
      return checkPermit2;
  }
};

export const getPermitdata = async ({
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
    console.log({ functionSelector, permitData, status, code });
    if (status === TxnStatus.success) {
      // permit was found, so now move to next srcToken
      return { status, code, permitData };
    } else if (status === TxnStatus.checkOtherPermit) {
      // Failed status is when the permit function is not found.
      // So, we move to next functionSelector.
      continue;
    } else {
      // Rejected status is only when the user has rejected the transaction
      // Or the permit2 transaction is rejected by the chain.
      // Else there is some other error, possibly couldn't generate signature.
      // Or RPC down.
      return { status, code, permitData: null };
    }
  }
};
