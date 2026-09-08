import { permit2Domain } from '../../../../src/utils/permit2/domain';
import { getPermit2WitnessData } from '../../../../src/utils/permit2/witnessData';
import { getPermitSingleData, getPermitTransferData, getPermit2Data } from '../../../../src/utils/permit2/permitData';
import { GaslessTxType } from '../../../../src/constants';

describe('utils/permit2', () => {
  const permit2Address = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

  it('permit2Domain builds typed data domain', () => {
    const domain = permit2Domain(permit2Address, 42161);
    expect(domain.name).toBe('Permit2');
    expect(domain.chainId).toBe(42161);
    expect(domain.verifyingContract).toBe(permit2Address);
  });

  it('getPermit2WitnessData returns default witness for non-gasless', () => {
    const { witnessData } = getPermit2WitnessData({
      gasless: false,
      account: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      spender: '0x0000000000000000000000000000000000000001',
    } as any);
    expect(witnessData.witnessTypeName).toBeDefined();
    expect(witnessData.witness).toHaveProperty('owner');
  });

  it('getPermit2WitnessData returns swap witness for gasless swap', () => {
    const { witnessData } = getPermit2WitnessData({
      gasless: true,
      txType: GaslessTxType.swap,
      account: '0x99BCEBf44433E901597D9fCb16E799a4847519f6',
      spender: '0x0000000000000000000000000000000000000001',
      txId: '0x1',
      executorFeesHash: '0x2',
      swapDataHash: '0x3',
    } as any);
    expect(witnessData.witness).toHaveProperty('swapDataHash');
  });

  it('getPermitSingleData builds permit single typed data', () => {
    const data = getPermitSingleData(
      {
        details: {
          token: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          amount: 1000n,
          expiration: 9999999999n,
          nonce: 0,
        },
        spender: '0x0000000000000000000000000000000000000001',
        sigDeadline: 9999999999n,
      },
      permit2Address,
      42161,
    );
    expect(data.domain.name).toBe('Permit2');
    expect(data.types.PermitSingle).toBeDefined();
    expect(data.message.details.amount).toBe(1000n);
  });

  it('getPermitTransferData includes witness in typed data', () => {
    const witness = {
      witness: { owner: '0x99BCEBf44433E901597D9fCb16E799a4847519f6', recipient: '0x1' },
      witnessTypeName: 'DZapTransferWitness',
      witnessType: { DZapTransferWitness: [{ name: 'owner', type: 'address' }] },
    } as any;
    const data = getPermitTransferData(
      {
        permitted: { token: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', amount: 1000n },
        spender: '0x0000000000000000000000000000000000000001',
        nonce: 1n,
        deadline: 9999999999n,
      },
      permit2Address,
      42161,
      witness,
    );
    expect(data.types.PermitWitnessTransferFrom).toBeDefined();
    expect((data.message as any).witness).toEqual(witness.witness);
  });

  it('getPermit2Data throws when witness missing for transfer type', () => {
    expect(() =>
      getPermit2Data(
        {
          permitted: { token: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', amount: 1000n },
          spender: '0x0000000000000000000000000000000000000001',
          nonce: 1n,
          deadline: 9999999999n,
        },
        permit2Address,
        42161,
      ),
    ).toThrow('Witness is required');
  });
});
