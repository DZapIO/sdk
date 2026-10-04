jest.mock('../../../src/utils/permit2', () => ({
  getPermit2Signature: jest.fn(),
}));

jest.mock('../../../src/utils/eip-2612/eip2612Permit', () => ({
  checkEIP2612PermitSupport: jest.fn(),
  getEIP2612PermitSignature: jest.fn(),
}));

import PermitTxnHandler from '../../../src/transactionHandlers/permit';
import { PermitTypes } from '../../../src/constants/permit';
import { ContractVersion, StatusCodes, TxnStatus } from '../../../src/enums';
import { Services } from '../../../src/constants';
import { dZapNativeTokenFormat } from '../../../src/constants';
import { getPermit2Signature } from '../../../src/utils/permit2';
import { checkEIP2612PermitSupport } from '../../../src/utils/eip-2612/eip2612Permit';

describe('transactionHandlers/permit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldUseBatchPermit', () => {
    it('returns true for explicit batch permit type', () => {
      expect(
        PermitTxnHandler.shouldUseBatchPermit({
          permitType: PermitTypes.PermitBatchWitnessTransferFrom,
          tokens: [
            { address: '0x1', amount: '100' },
            { address: '0x2', amount: '200' },
          ],
          oneToMany: false,
          contractVersion: ContractVersion.v2,
          service: Services.trade,
        }),
      ).toBe(true);
    });

    it('returns true for auto permit with multiple tokens', () => {
      expect(
        PermitTxnHandler.shouldUseBatchPermit({
          permitType: PermitTypes.AutoPermit,
          tokens: [
            { address: '0x1', amount: '100' },
            { address: '0x2', amount: '200' },
          ],
          oneToMany: false,
          contractVersion: ContractVersion.v2,
          service: Services.trade,
        }),
      ).toBe(true);
    });

    it('returns false for v1 contract on trade service', () => {
      expect(
        PermitTxnHandler.shouldUseBatchPermit({
          permitType: PermitTypes.PermitBatchWitnessTransferFrom,
          tokens: [{ address: '0x1', amount: '100' }],
          oneToMany: false,
          contractVersion: ContractVersion.v1,
          service: Services.trade,
        }),
      ).toBe(false);
    });
  });

  describe('generatePermitDataForToken', () => {
    it('returns default permit for native token', async () => {
      const result = await PermitTxnHandler.generatePermitDataForToken({
        token: { address: dZapNativeTokenFormat, amount: '100', index: 0 },
        oneToMany: false,
        totalSrcAmount: 100n,
        permitType: PermitTypes.AutoPermit,
        chainId: 42161,
        account: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
        spender: '0x0000000000000000000000000000000000000001',
        deadline: 9999999999n,
        signer: {} as any,
        service: Services.trade,
        contractVersion: ContractVersion.v2,
        gasless: false,
      } as any);

      expect(result.status).toBe(TxnStatus.success);
      expect(result.permitType).toBe(PermitTypes.EIP2612Permit);
    });

    it('uses permit2 when eip2612 not supported', async () => {
      (checkEIP2612PermitSupport as jest.Mock).mockResolvedValue({ supportsPermit: false });
      (getPermit2Signature as jest.Mock).mockResolvedValue({
        status: TxnStatus.success,
        code: StatusCodes.Success,
        permitData: '0xpermit',
        nonce: 1n,
      });

      const result = await PermitTxnHandler.generatePermitDataForToken({
        token: { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', amount: '100', index: 0 },
        oneToMany: false,
        totalSrcAmount: 100n,
        permitType: PermitTypes.AutoPermit,
        chainId: 42161,
        account: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
        spender: '0x0000000000000000000000000000000000000001',
        deadline: 9999999999n,
        signer: {} as any,
        service: Services.trade,
        contractVersion: ContractVersion.v2,
        gasless: false,
      } as any);

      expect(getPermit2Signature).toHaveBeenCalled();
      expect(result.permitData).toBe('0xpermit');
    });
  });

  describe('signPermit', () => {
    it('returns success for empty tokens with batch permit', async () => {
      const result = await PermitTxnHandler.signPermit({
        tokens: [],
        permitType: PermitTypes.PermitBatchWitnessTransferFrom,
        sender: '0x0',
        spender: '0x1',
        chainId: 42161,
        deadline: 999n,
        signer: {} as any,
        service: Services.trade,
        contractVersion: ContractVersion.v2,
      } as any);
      expect(result.status).toBe(TxnStatus.success);
    });
  });
});
