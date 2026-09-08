jest.mock('bitcoin-address-validation', () => ({
  Network: { mainnet: 'mainnet', testnet: 'testnet' },
  validate: jest.fn(),
}));

import { validate, Network } from 'bitcoin-address-validation';
import { classifyBvmAddress } from '../../../../src/utils/address/bvm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';
import { exclusiveChainIds } from '../../../../src/constants/chains';

const mockedValidate = validate as jest.MockedFunction<typeof validate>;

describe('utils/address/bvm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidate.mockReturnValue(true);
  });

  it('returns INVALID for invalid bitcoin address', async () => {
    mockedValidate.mockReturnValue(false);
    const result = await classifyBvmAddress({
      address: 'not-a-btc-address',
      chainId: exclusiveChainIds.btc,
      chainConfig: mockChainConfig,
    });
    expect(result.kind).toBe(AddressKind.INVALID);
    expect(result.valid).toBe(false);
    expect(mockedValidate).toHaveBeenCalledWith('not-a-btc-address', Network.mainnet);
  });

  it('returns NATIVE for native currency address', async () => {
    const result = await classifyBvmAddress({
      address: 'btc',
      chainId: exclusiveChainIds.btc,
      chainConfig: mockChainConfig,
    });
    expect(result.kind).toBe(AddressKind.NATIVE);
    expect(result.isNative).toBe(true);
  });

  it('returns WALLET for valid non-native address', async () => {
    const result = await classifyBvmAddress({
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      chainId: exclusiveChainIds.btc,
      chainConfig: mockChainConfig,
    });
    expect(result.kind).toBe(AddressKind.WALLET);
    expect(result.valid).toBe(true);
  });

  it('uses testnet network when chain is not mainnet', async () => {
    const testnetConfig = {
      ...mockChainConfig,
      [exclusiveChainIds.btc]: { ...mockChainConfig[exclusiveChainIds.btc], mainnet: false },
    };
    await classifyBvmAddress({
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      chainId: exclusiveChainIds.btc,
      chainConfig: testnetConfig,
    });
    expect(mockedValidate).toHaveBeenCalledWith('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', Network.testnet);
  });

  it('uses mainnet validation when chain mainnet flag is omitted', async () => {
    const configWithoutMainnetFlag = {
      ...mockChainConfig,
      [exclusiveChainIds.btc]: {
        ...mockChainConfig[exclusiveChainIds.btc],
        mainnet: undefined,
      },
    } as typeof mockChainConfig;

    await classifyBvmAddress({
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      chainId: exclusiveChainIds.btc,
      chainConfig: configWithoutMainnetFlag,
    });

    expect(mockedValidate).toHaveBeenCalledWith('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', Network.mainnet);
  });
});
