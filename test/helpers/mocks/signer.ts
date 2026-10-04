import { Signer } from 'ethers';
import { WalletClient } from 'viem';

export const createMockEthersSigner = (): Signer => {
  const signer = {
    sendTransaction: jest.fn().mockResolvedValue({ hash: '0xabc123' }),
    getAddress: jest.fn().mockResolvedValue('0x99BCEBf44433E901597D9fCb16E799a4847519f6'),
    getChainId: jest.fn().mockResolvedValue(42161),
  };
  Object.setPrototypeOf(signer, Signer.prototype);
  return signer as unknown as Signer;
};

export const createMockWalletClient = (): WalletClient => {
  return {
    sendTransaction: jest.fn().mockResolvedValue('0xdef456'),
    account: { address: '0x99BCEBf44433E901597D9fCb16E799a4847519f6' },
  } as unknown as WalletClient;
};
