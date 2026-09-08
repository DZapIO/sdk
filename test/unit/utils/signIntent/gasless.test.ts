jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  getContract: jest.fn(),
}));

jest.mock('../../../../src/utils/index', () => {
  const actual = jest.requireActual('../../../../src/utils/index');
  return {
    ...actual,
    getPublicClient: jest.fn().mockReturnValue({}),
    getDZapAbi: jest.fn().mockReturnValue([]),
  };
});

import { getContract } from 'viem';
import { verifyTypedData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';
import type { WalletClient } from 'viem';
import { signGaslessDzapUserIntent } from '../../../../src/utils/signIntent/gasless';
import { GaslessTxType, Services } from '../../../../src/constants';
import { dZapIntentPrimaryType, eip2612GaslessDomain } from '../../../../src/constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../../../../src/enums';
import { DzapUserIntentBridgeTypes, DzapUserIntentSwapBridgeTypes, DzapUserIntentSwapTypes } from '../../../../src/types/eip-2612';
import type { Gasless2612PermitParams } from '../../../../src/types/permit';
import type { HexString } from '../../../../src/types';

describe('utils/signIntent/gasless', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d55b874079130569b6721656758743af4e6eb48f';
  const account = privateKeyToAccount(testPrivateKey);
  const spender = '0x0000000000000000000000000000000000000001' as HexString;
  const chainId = arbitrum.id;
  const deadline = BigInt(4_000_000_000);
  const nonce = BigInt(7);
  const txId = '0x0000000000000000000000000000000000000000000000000000000000000001' as HexString;
  const executorFeesHash = '0x1111111111111111111111111111111111111111111111111111111111111111' as HexString;
  const swapDataHash = '0x2222222222222222222222222222222222222222222222222222222222222222' as HexString;
  const adapterDataHash = '0x3333333333333333333333333333333333333333333333333333333333333333' as HexString;

  const walletClient = {
    account,
    signTypedData: account.signTypedData.bind(account),
  } as unknown as WalletClient;

  const baseParams = {
    gasless: true as const,
    chainId,
    account: account.address,
    spender,
    signer: walletClient,
    contractVersion: ContractVersion.v2,
    service: Services.trade,
    txId,
    executorFeesHash,
    deadline,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getContract as jest.Mock).mockReturnValue({
      read: {
        getNonce: jest.fn().mockResolvedValue(nonce),
      },
    });
  });

  const verifySignature = async ({
    signature,
    types,
    primaryType,
    message,
  }: {
    signature: `0x${string}`;
    types: Record<string, { name: string; type: string }[]>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => {
    return verifyTypedData({
      address: account.address,
      domain: {
        name: eip2612GaslessDomain.name,
        version: eip2612GaslessDomain.version,
        chainId,
        verifyingContract: spender,
        salt: eip2612GaslessDomain.salt,
      },
      types,
      primaryType,
      message,
      signature,
    });
  };

  it('signs and verifies gasless swap intent', async () => {
    const params: Gasless2612PermitParams = {
      ...baseParams,
      txType: GaslessTxType.swap,
      swapDataHash,
    };

    const result = await signGaslessDzapUserIntent(params);

    expect(result.status).toBe(TxnStatus.success);
    expect(result.code).toBe(StatusCodes.Success);
    expect(result.data?.nonce).toBe(nonce);
    expect(result.data?.deadline).toBe(deadline);
    expect(result.data?.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);

    const message = {
      txId,
      user: account.address,
      executorFeesHash,
      swapDataHash,
      nonce,
      deadline,
    };

    await expect(
      verifySignature({
        signature: result.data!.signature,
        types: DzapUserIntentSwapTypes,
        primaryType: dZapIntentPrimaryType.SignedGasLessSwapData,
        message,
      }),
    ).resolves.toBe(true);
  });

  it('signs and verifies gasless bridge intent', async () => {
    const params: Gasless2612PermitParams = {
      ...baseParams,
      txType: GaslessTxType.bridge,
      adapterDataHash,
    };

    const result = await signGaslessDzapUserIntent(params);

    expect(result.status).toBe(TxnStatus.success);
    expect(result.data?.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);

    const message = {
      txId,
      user: account.address,
      nonce,
      deadline,
      executorFeesHash,
      adapterDataHash,
    };

    await expect(
      verifySignature({
        signature: result.data!.signature,
        types: DzapUserIntentBridgeTypes,
        primaryType: dZapIntentPrimaryType.SignedGasLessBridgeData,
        message,
      }),
    ).resolves.toBe(true);
  });

  it('signs and verifies gasless swap-bridge intent when swapDataHash is present', async () => {
    const params: Gasless2612PermitParams = {
      ...baseParams,
      txType: GaslessTxType.bridge,
      swapDataHash,
      adapterDataHash,
    };

    const result = await signGaslessDzapUserIntent(params);

    expect(result.status).toBe(TxnStatus.success);

    const message = {
      txId,
      user: account.address,
      nonce,
      deadline,
      executorFeesHash,
      swapDataHash,
      adapterDataHash,
    };

    await expect(
      verifySignature({
        signature: result.data!.signature,
        types: DzapUserIntentSwapBridgeTypes,
        primaryType: dZapIntentPrimaryType.SignedGasLessSwapBridgeData,
        message,
      }),
    ).resolves.toBe(true);
  });

  it('reads nonce from verifier contract before signing', async () => {
    const getNonce = jest.fn().mockResolvedValue(BigInt(42));
    (getContract as jest.Mock).mockReturnValue({
      read: { getNonce },
    });

    const params: Gasless2612PermitParams = {
      ...baseParams,
      txType: GaslessTxType.swap,
      swapDataHash,
    };

    const result = await signGaslessDzapUserIntent(params);

    expect(getContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: spender,
      }),
    );
    expect(getNonce).toHaveBeenCalledWith([account.address]);
    expect(result.data?.nonce).toBe(BigInt(42));
  });

  it('returns rejected status when signing fails', async () => {
    const rejectingClient = {
      ...walletClient,
      signTypedData: jest.fn().mockRejectedValue({ code: StatusCodes.UserRejectedRequest }),
    };

    const params: Gasless2612PermitParams = {
      ...baseParams,
      signer: rejectingClient as typeof walletClient,
      txType: GaslessTxType.swap,
      swapDataHash,
    };

    const result = await signGaslessDzapUserIntent(params);

    expect(result.status).toBe(TxnStatus.rejected);
    expect(result.code).toBe(StatusCodes.UserRejectedRequest);
  });
});
