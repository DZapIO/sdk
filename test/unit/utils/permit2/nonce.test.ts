jest.mock('../../../../src/utils', () => {
  const actual = jest.requireActual('../../../../src/utils');
  return {
    ...actual,
    getPublicClient: jest.fn(),
  };
});

import { maxUint256, type PublicClient } from 'viem';
import { getPublicClient } from '../../../../src/utils';
import { NonceManager, getNextPermit2Nonce } from '../../../../src/utils/permit2/nonce';

const mockedGetPublicClient = getPublicClient as jest.MockedFunction<typeof getPublicClient>;

function createNonceBitmapClient(bitmapValues: bigint[] | ((word: bigint) => bigint)) {
  const nonceBitmap = jest.fn(async ({ args }: { args: [string, bigint] }) => {
    const word = args[1];
    if (typeof bitmapValues === 'function') {
      return bitmapValues(word);
    }
    const index = Number(word);
    if (index >= bitmapValues.length) {
      return 0n;
    }
    return bitmapValues[index];
  });

  return {
    readContract: nonceBitmap,
  } as unknown as PublicClient;
}

describe('utils/permit2/nonce', () => {
  const permit2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
  const account = '0x99BCEBf44433E901597D9fCb16E799a4847519f6';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('NonceManager returns first unused nonce from bitmap', async () => {
    const manager = new NonceManager(createNonceBitmapClient([0n]), permit2);
    await expect(manager.nextNonce(account)).resolves.toBe(0n);
  });

  it('NonceManager skips used nonce bits', async () => {
    const manager = new NonceManager(createNonceBitmapClient([1n]), permit2);
    await expect(manager.nextNonce(account)).resolves.toBe(1n);
  });

  it('NonceManager skips multiple used nonce bits', async () => {
    const manager = new NonceManager(createNonceBitmapClient([3n]), permit2);
    await expect(manager.nextNonce(account)).resolves.toBe(2n);
  });

  it('NonceManager advances to the next word when the current bitmap is full', async () => {
    const manager = new NonceManager(createNonceBitmapClient([maxUint256, 0n]), permit2);
    await expect(manager.nextNonce(account)).resolves.toBe(256n);
  });

  it('NonceManager returns the next nonce in the following word after a full bitmap', async () => {
    const manager = new NonceManager(createNonceBitmapClient([maxUint256, 1n]), permit2);
    await expect(manager.nextNonce(account)).resolves.toBe(257n);
  });

  it('NonceManager throws when no unused nonce is found within the iteration limit', async () => {
    const manager = new NonceManager(createNonceBitmapClient(() => maxUint256), permit2);
    await expect(manager.nextNonce(account)).rejects.toThrow('Max iterations reached');
  });

  it('NonceManager.getNonceBitmap reads the bitmap for a word', async () => {
    const client = createNonceBitmapClient([9n]);
    const manager = new NonceManager(client, permit2);

    await expect(manager.getNonceBitmap(account, 0n)).resolves.toBe(9n);
  });

  it('NonceManager.isNonceUsed checks bitmap bit', async () => {
    const manager = new NonceManager(createNonceBitmapClient([2n]), permit2);
    await expect(manager.isNonceUsed(account, 1n)).resolves.toBe(true);
    await expect(manager.isNonceUsed(account, 0n)).resolves.toBe(false);
  });

  it('getNextPermit2Nonce delegates to NonceManager', async () => {
    mockedGetPublicClient.mockReturnValue(createNonceBitmapClient([0n]) as ReturnType<typeof getPublicClient>);
    await expect(getNextPermit2Nonce(permit2, account, 42161)).resolves.toBe(0n);
  });

  it('getNextPermit2Nonce forwards rpc urls to getPublicClient', async () => {
    mockedGetPublicClient.mockReturnValue(createNonceBitmapClient([0n]) as ReturnType<typeof getPublicClient>);
    const rpcUrls = ['https://arb.example.com'];

    await getNextPermit2Nonce(permit2, account, 42161, rpcUrls);

    expect(mockedGetPublicClient).toHaveBeenCalledWith({ chainId: 42161, rpcUrls });
  });
});
