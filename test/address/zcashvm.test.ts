import { AddressKind } from '../../src/types/address';
import { classifyZcashvmAddress, isValidZcashAddress } from '../../src/utils/address/zcashvm';

describe('zcashvm address', () => {
  it.each(['t1Xt422VNZbzYpZ33LJzCXdYHS9KFMBFTyo', 't3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd'])('accepts %s', (address) => {
    expect(isValidZcashAddress(address)).toBe(true);
  });

  it.each([
    't1Xt422VNZbzYpZ33LJzCXdYHS9KFMBFTyp',
    'tmMcWbZU8t39htCR1fQRfRSHtkW4p3Ax5Se',
    'tex1s2rt77ggv6q989lr49rkgzmh5slsksa9khdgte',
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    '0x0000000000000000000000000000000000000000',
    '',
  ])('rejects %s', (address) => {
    expect(isValidZcashAddress(address)).toBe(false);
  });

  it('classifies a transparent address as a wallet', async () => {
    await expect(classifyZcashvmAddress({ address: 't1Xt422VNZbzYpZ33LJzCXdYHS9KFMBFTyo' })).resolves.toMatchObject({
      valid: true,
      kind: AddressKind.WALLET,
    });
  });
});
