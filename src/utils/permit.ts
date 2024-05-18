import { MaxSigDeadline, SignatureTransfer, TokenPermissions } from '@uniswap/permit2-sdk';
import { ConnectorType, Erc20PermitFunctions } from 'src/enums';
import { HexString } from 'src/types';
import { Abi, encodeAbiParameters, hexToNumber, parseAbiParameters, slice } from 'viem';
import { getWalletClient, initializeReadOnlyProvider } from '.';
import { abi as PermitAbi } from '../artifacts/ERC20Permit';

export const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as HexString;

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

export async function getPermit2SignatureAndCalldataForTransfer(
  chainId: number,
  poolAddress: HexString,
  userAddress: HexString,
  contributionTokenAddress: HexString,
  spender: HexString,
  userNonce: string,
  amount: string,
  connectorType: ConnectorType,
  wcProjectId: string,
  deadline = MaxSigDeadline,
) {
  const nonce = userNonce;
  const permit = {
    permitted: {
      token: contributionTokenAddress,
      amount,
    },
    spender,
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
      spender: spender,
      nonce: BigInt(permitInfo.values.nonce.toString()),
      deadline: BigInt(permitInfo.values.deadline.toString()),
    },
  });
  const msgHash = SignatureTransfer.hash(permit, poolAddress, chainId);
  const permitDetails = {
    permitted: {
      token: contributionTokenAddress,
      amount: BigInt(amount),
    },
    nonce,
    deadline,
  };
  const transferDetails = {
    to: spender,
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

export const getPermitSignature = async (
  chainId: number,
  account: HexString,
  token: HexString,
  spender: HexString,
  amount: string,
  name: string,
  connectorType: ConnectorType,
  wcProjectId: string,
  rpcProvider: string,
  deadline = MaxSigDeadline,
): Promise<{ data: any }> => {
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
    spender: spender,
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
    spender,
    BigInt(amount),
    BigInt(deadline.toString()),
    v,
    r,
    s,
  ]);
  console.log({ data });
  return { data };
};
