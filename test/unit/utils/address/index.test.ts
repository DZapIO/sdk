jest.mock('../../../../src/dZapClient', () => ({
  __esModule: true,
  default: {
    getChainConfig: jest.fn(),
  },
}));

jest.mock('../../../../src/utils/address/evm', () => ({ classifyEvmAddress: jest.fn() }));
jest.mock('../../../../src/utils/address/svm', () => ({ classifySvmAddress: jest.fn() }));
jest.mock('../../../../src/utils/address/bvm', () => ({ classifyBvmAddress: jest.fn() }));
jest.mock('../../../../src/utils/address/suivm', () => ({ classifySuivmAddress: jest.fn() }));
jest.mock('../../../../src/utils/address/aptosvm', () => ({ classifyAptosvmAddress: jest.fn() }));
jest.mock('../../../../src/utils/address/tonvm', () => ({ classifyTonvmAddress: jest.fn() }));
jest.mock('../../../../src/utils/address/tronvm', () => ({ classifyTronvmAddress: jest.fn() }));

import DZapClient from '../../../../src/dZapClient';
import { classifyAddress } from '../../../../src/utils/address';
import { classifyEvmAddress } from '../../../../src/utils/address/evm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';

describe('utils/address/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (DZapClient.getChainConfig as jest.Mock).mockResolvedValue(mockChainConfig);
  });

  it('classifyAddress delegates to chain-type classifier', async () => {
    (classifyEvmAddress as jest.Mock).mockResolvedValue({ kind: AddressKind.WALLET });
    const result = await classifyAddress({
      address: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      chainId: 42161,
    });
    expect(classifyEvmAddress).toHaveBeenCalled();
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('classifyAddress throws when chain type not found', async () => {
    await expect(
      classifyAddress({
        address: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
        chainId: 99999,
      }),
    ).rejects.toThrow('Chain type not found');
  });

  it('classifyAddress throws when resolver is missing for chain type', async () => {
    (DZapClient.getChainConfig as jest.Mock).mockResolvedValue({
      88888: {
        chainId: 88888,
        chainType: 'unsupported-chain-type',
        isEnabled: true,
      },
    });

    await expect(
      classifyAddress({
        address: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
        chainId: 88888,
      }),
    ).rejects.toThrow('Resolver not found');
  });
});
