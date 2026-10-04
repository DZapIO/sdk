import { encodeApproveCallData } from '../../../src/utils/encodeApproveCall';
import { permit2, sampleAccounts } from '../../fixtures/realWorld';

describe('utils/encodeApproveCall', () => {
  it('encodes approve calldata for Permit2 spender and USDC-scale amount', () => {
    const data = encodeApproveCallData({
      spender: permit2.defaultAddress,
      amount: BigInt(1_000_000), // 1 USDC (6 decimals)
    });

    expect(data).toMatch(/^0x095ea7b3/); // approve(address,uint256) selector
    expect(data.toLowerCase()).toContain(permit2.defaultAddress.slice(2).toLowerCase());
  });

  it('encodes approve calldata with arbitrary spender', () => {
    const data = encodeApproveCallData({
      spender: sampleAccounts.testWallet,
      amount: BigInt(1000),
    });
    expect(data).toMatch(/^0x/);
    expect(data.length).toBeGreaterThan(10);
  });
});
