const mockGetParsedAccountInfo = jest.fn();

jest.mock('@solana/web3.js', () => {
  const actual = jest.requireActual('@solana/web3.js');
  return {
    ...actual,
    clusterApiUrl: jest.fn(() => 'https://api.mainnet-beta.solana.com'),
    Connection: jest.fn().mockImplementation(() => ({
      getParsedAccountInfo: mockGetParsedAccountInfo,
    })),
  };
});

import { classifySvmAddress, parseSvmAddress } from '../../../../src/utils/address/svm';
import { mockChainConfig } from '../../../fixtures/chainConfig';
import { AddressKind } from '../../../../src/types/address';
import { exclusiveChainIds } from '../../../../src/constants/chains';

describe('utils/address/svm', () => {
  const validWallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuQosFUCy';
  const nativeMint = 'So11111111111111111111111111111111111111112';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parseSvmAddress returns null for invalid address', () => {
    expect(parseSvmAddress('not-valid')).toBeNull();
    expect(parseSvmAddress(validWallet)).not.toBeNull();
  });

  it('returns INVALID for malformed address', async () => {
    const result = await classifySvmAddress({
      address: 'bad-address',
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.INVALID);
  });

  it('returns NATIVE for wrapped SOL mint', async () => {
    const result = await classifySvmAddress({
      address: nativeMint,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.NATIVE);
  });

  it('returns null when RPC fails', async () => {
    mockGetParsedAccountInfo.mockRejectedValue(new Error('rpc error'));
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns null when RPC throws a non-error value', async () => {
    mockGetParsedAccountInfo.mockRejectedValue('rpc error');
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result).toBeNull();
  });

  it('returns WALLET when account does not exist', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({ value: null });
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns CONTRACT for executable program account', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({
      value: {
        executable: true,
        owner: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        data: 'raw',
      },
    });
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns TOKEN for token mint account', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({
      value: {
        executable: false,
        owner: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        data: { parsed: { type: 'mint' } },
      },
    });
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.TOKEN);
  });

  it('returns CONTRACT for token account owned by token program', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({
      value: {
        executable: false,
        owner: { toBase58: () => 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' },
        data: { parsed: { type: 'account' } },
      },
    });
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.CONTRACT);
  });

  it('returns WALLET for non-token parsed account data', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({
      value: {
        executable: false,
        owner: { toBase58: () => '11111111111111111111111111111111' },
        data: { parsed: { type: 'other' } },
      },
    });
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });

  it('returns WALLET when parsed token data has no type', async () => {
    mockGetParsedAccountInfo.mockResolvedValue({
      value: {
        executable: false,
        owner: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        data: { parsed: {} },
      },
    });
    const result = await classifySvmAddress({
      address: validWallet,
      chainId: exclusiveChainIds.solana,
      chainConfig: mockChainConfig,
    });
    expect(result?.kind).toBe(AddressKind.WALLET);
  });
});
