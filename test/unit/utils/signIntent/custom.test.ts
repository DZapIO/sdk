import { verifyTypedData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum } from 'viem/chains';
import type { WalletClient } from 'viem';
import { signCustomTypedData } from '../../../../src/utils/signIntent/custom';
import { StatusCodes, TxnStatus } from '../../../../src/enums';
import type { HexString } from '../../../../src/types';

describe('utils/signIntent/custom', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d55b874079130569b6721656758743af4e6eb48f';
  const account = privateKeyToAccount(testPrivateKey);
  const chainId = arbitrum.id;

  const walletClient = {
    account,
    signTypedData: account.signTypedData.bind(account),
  } as unknown as WalletClient;

  const domain = {
    name: 'TestDomain',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000001' as HexString,
  };

  const types = {
    TestMessage: [{ name: 'content', type: 'string' }],
  };

  const primaryType = 'TestMessage';
  const message = { content: 'hello' };

  it('signs custom typed data and returns verifiable signature', async () => {
    const result = await signCustomTypedData({
      account: account.address,
      signer: walletClient,
      domain,
      types,
      message,
      primaryType,
    });

    expect(result.status).toBe(TxnStatus.success);
    expect(result.code).toBe(StatusCodes.Success);
    expect(result.data?.message).toEqual(message);
    expect(result.data?.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);

    await expect(
      verifyTypedData({
        address: account.address,
        domain,
        types,
        primaryType,
        message,
        signature: result.data!.signature,
      }),
    ).resolves.toBe(true);
  });

  it('returns rejected status when signing fails', async () => {
    const rejectingClient = {
      ...walletClient,
      signTypedData: jest.fn().mockRejectedValue({ code: StatusCodes.UserRejectedRequest }),
    };

    const result = await signCustomTypedData({
      account: account.address,
      signer: rejectingClient as typeof walletClient,
      domain,
      types,
      message,
      primaryType,
    });

    expect(result.status).toBe(TxnStatus.rejected);
    expect(result.code).toBe(StatusCodes.UserRejectedRequest);
  });
});
