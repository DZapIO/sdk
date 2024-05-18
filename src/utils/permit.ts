import { MaxSigDeadline, MaxUint256, SignatureTransfer, TokenPermissions } from '@uniswap/permit2-sdk';
import { ConnectorType, Erc20Functions, Erc20PermitFunctions, PermitType, TxnStatus } from 'src/enums';
import { HexString } from 'src/types';
import { Abi, TransactionReceipt, encodeAbiParameters, erc20Abi, hexToNumber, parseAbiParameters, parseUnits, slice } from 'viem';
import { getWalletClient, initializeReadOnlyProvider } from '.';
import { abi as PermitAbi } from '../artifacts/ERC20Permit';
import { NATIVE_TOKEN_ADDRESS, PERMIT_TYPEHASH_CONST } from 'src/constants';

export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as HexString;
export const deadline = MaxSigDeadline;

export const readContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  rpcProvider,
  args = [],
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  rpcProvider: string;
  args?: unknown[];
}) => {
  try {
    return await initializeReadOnlyProvider({ chainId, rpcProvider }).readContract({
      address: contractAddress,
      abi,
      functionName,
      args,
    });
  } catch (e) {
    console.log(e);
  }
};

export const writeContract = async ({
  chainId,
  contractAddress,
  abi,
  functionName,
  args = [],
  userAddress,
  value = '0',
  rpcProvider,
  connectorType,
  wcProjectId,
}: {
  chainId: number;
  contractAddress: HexString;
  abi: Abi;
  functionName: string;
  args?: unknown[];
  userAddress: HexString;
  value?: string;
  rpcProvider: string;
  connectorType: ConnectorType;
  wcProjectId: string;
}): Promise<TransactionReceipt | { status: string }> => {
  const publicClient = initializeReadOnlyProvider({ chainId, rpcProvider });
  try {
    const { request } = await publicClient.simulateContract({
      address: contractAddress,
      abi,
      functionName,
      args,
      account: userAddress,
      value,
    });
    console.log(request);
    const walletClient = await getWalletClient({ chainId, account: userAddress, connectorType, wcProjectId });
    const hash = await walletClient.writeContract(request);
    // wait for block confirmation and return transaction receipt
    return await publicClient.waitForTransactionReceipt({ hash });
  } catch (e: unknown) {
    console.log({ e });
    return { status: 'failed' };
  }
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
    deadline,
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
  const msgHash = SignatureTransfer.hash(permit, dzapContractAddress, chainId);
  const permitDetails = {
    permitted: {
      token: contributionTokenAddress,
      amount: BigInt(amount),
    },
    nonce,
    deadline,
  };
  const transferDetails = {
    to: dzapContractAddress,
    requestedAmount: BigInt(amount),
  };

  const data = encodeAbiParameters(
    parseAbiParameters(
      '(address token, uint256 amount) permitted, uint256 nonce,  uint256 deadline, (address to, uint256 requestedAmount) transferDetails, address owner, bytes signature',
    ),
    [permitDetails.permitted, BigInt(permitDetails.nonce), BigInt(permitDetails.deadline.toString()), transferDetails, userAddress, signature],
  );
  const customPermitDataForTransfer = encodeAbiParameters(parseAbiParameters('uint256 nonce, uint256 deadline, bytes signature'), [
    BigInt(permitDetails.nonce),
    BigInt(permitDetails.deadline.toString()),
    signature,
  ]);
  return { signature, msgHash, data, customPermitDataForTransfer };
}

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
}): Promise<{ data: any }> => {
  const userNonce = (await readContract({
    chainId,
    contractAddress: token,
    abi: PermitAbi as Abi,
    functionName: Erc20PermitFunctions.NONCES,
    rpcProvider,
    args: [account],
  })) as string;
  let version: string;
  try {
    version = (await readContract({
      chainId,
      contractAddress: token,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.VERSION,
      rpcProvider,
    })) as string;
  } catch (e) {
    console.log(e);
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
    deadline: BigInt(deadline.toString()),
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
    BigInt(deadline.toString()),
    v,
    r,
    s,
  ]);
  console.log({ data });
  return { data };
};

export const permitHandler = async ({
  chainId,
  userAddress,
  contributionTokenAddress,
  amount,
  connectorType,
  wcProjectId,
  rpcProvider,
  dzapContractAddress,
}: {
  chainId: number;
  userAddress: HexString;
  contributionTokenAddress: HexString;
  amount: string;
  connectorType: ConnectorType;
  wcProjectId: string;
  rpcProvider: string;
  dzapContractAddress: HexString;
}) => {
  let permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, '0x']);
  if (contributionTokenAddress === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
    return { status: 'success' };
  }
  const allowance = await readContract({
    chainId,
    contractAddress: contributionTokenAddress,
    abi: erc20Abi,
    functionName: Erc20Functions.ALLOWANCE,
    args: [userAddress, dzapContractAddress],
    rpcProvider,
  });
  // @dev allowance is more than required amount, so transact
  if ((allowance as bigint) > parseUnits(amount.toString(), 18)) {
    //@TODo update 18 to decimals
    permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, '0x']);
    return { status: 'success', permitData };
  }
  const name = (await readContract({
    chainId,
    contractAddress: contributionTokenAddress,
    abi: erc20Abi,
    functionName: Erc20Functions.NAME,
    rpcProvider,
  })) as string;
  let isSigned = true;
  let checkPermit2 = false;
  // @dev allowance is less than required amount, so check if token supports permit
  try {
    // @dev with erc20 permit
    console.log('checking with erc20 permit');
    const PERMIT_TYPEHASH = (await initializeReadOnlyProvider({ chainId, rpcProvider }).readContract({
      address: contributionTokenAddress,
      abi: PermitAbi as Abi,
      functionName: Erc20PermitFunctions.PERMIT_TYPEHASH,
    })) as string;
    if (PERMIT_TYPEHASH.toLowerCase() !== PERMIT_TYPEHASH_CONST.toLowerCase()) {
      // eip712 type hash
      throw new Error('PERMIT_TYPEHASH not found');
    }

    const signatureData = await getPermitSignature({
      chainId,
      account: userAddress,
      token: contributionTokenAddress,
      dzapContractAddress,
      amount,
      name,
      connectorType,
      wcProjectId,
      rpcProvider,
    });
    permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT, signatureData.data]);
  } catch (e: any) {
    // @dev with permit2
    if (e?.code === 4001) {
      isSigned = false;
    } else {
      checkPermit2 = true;
    }
  }
  if (checkPermit2) {
    try {
      console.log('checking with permit2');
      const publicClient = initializeReadOnlyProvider({ chainId, rpcProvider });
      const nonce = await publicClient.getTransactionCount({
        address: userAddress,
      });
      const permitAllowance = (await readContract({
        chainId,
        contractAddress: contributionTokenAddress,
        abi: erc20Abi,
        functionName: Erc20Functions.ALLOWANCE,
        args: [userAddress, PERMIT2_ADDRESS],
        rpcProvider,
      })) as bigint;
      if (permitAllowance < parseUnits(amount, 18)) {
        //@TODo update 18 to decimals
        const txReceipt = await writeContract({
          chainId,
          contractAddress: contributionTokenAddress,
          abi: erc20Abi,
          functionName: Erc20Functions.APPROVE,
          args: [PERMIT2_ADDRESS, MaxUint256],
          userAddress,
          rpcProvider,
          connectorType,
          wcProjectId,
        });
        if (txReceipt.status === TxnStatus.success) {
          const signatureData = await getPermit2SignatureAndCalldataForTransfer({
            chainId,
            dzapContractAddress,
            userAddress,
            contributionTokenAddress,
            nonce: nonce.toString(), //pass the nonce
            amount: amount.toString(),
            connectorType,
            wcProjectId,
          });
          permitData = encodeAbiParameters(parseAbiParameters('uint8, bytes'), [PermitType.PERMIT2, signatureData.customPermitDataForTransfer]);
        } else return { status: 'rejected' };
      }
    } catch (e) {
      isSigned = false;
    }
  }
  if (!isSigned) return { status: 'rejected' };
  return { status: 'success', permitData };
};
