import { suiNativeToken } from '../../src/constants/address';
import { exclusiveChainIds } from '../../src/constants/chains';
import { decodeSuivmTransaction } from '../../src/utils/decoder/suivm';

const mockGetTransaction = jest.fn();
jest.mock('@mysten/sui/grpc', () => ({ SuiGrpcClient: jest.fn(() => ({ getTransaction: mockGetTransaction })) }));

const SENDER = `0x${'aa'.repeat(32)}`;
const SPONSOR = `0x${'bb'.repeat(32)}`;
const USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
// the node reports coin types with a padded package address; token lists spell SUI short
const SUI_PADDED = `0x${'0'.repeat(63)}2::sui::SUI`;

// a swap of 5 USDC for 2 SUI whose gas of 1000 MIST is paid by gasOwner
const serveSwap = (gasOwner: string) => {
  const suiChangeOfSender = gasOwner === SENDER ? BigInt(2_000_000_000) - BigInt(1_000) : BigInt(2_000_000_000);
  mockGetTransaction.mockResolvedValue({
    $kind: 'Transaction',
    Transaction: {
      sender: SENDER,
      transaction: { gasData: { owner: gasOwner } },
      effects: { gasUsed: { computationCost: '1500', storageCost: '500', storageRebate: '1000' } },
      balanceChanges: [
        { amount: '-5000000', coinType: USDC, address: SENDER },
        { amount: suiChangeOfSender.toString(), coinType: SUI_PADDED, address: SENDER },
        ...(gasOwner === SENDER ? [] : [{ amount: '-1000', coinType: SUI_PADDED, address: gasOwner }]),
      ],
    },
  });
};

describe('sui transaction decoding', () => {
  it('leaves out the gas the sender paid', async () => {
    serveSwap(SENDER);

    const result = await decodeSuivmTransaction({ txHash: 'digest', chainId: exclusiveChainIds.sui, rpcUrls: ['https://sui.example'] });

    expect(result).toEqual({
      sent: [{ token: USDC, amount: BigInt(5_000_000) }],
      received: [{ token: suiNativeToken, amount: BigInt(2_000_000_000) }],
    });
  });

  it('does not take gas out of the sender when a sponsor paid it', async () => {
    serveSwap(SPONSOR);

    const result = await decodeSuivmTransaction({ txHash: 'digest', chainId: exclusiveChainIds.sui, rpcUrls: ['https://sui.example'] });

    expect(result).toEqual({
      sent: [{ token: USDC, amount: BigInt(5_000_000) }],
      received: [{ token: suiNativeToken, amount: BigInt(2_000_000_000) }],
    });
  });

  it('passes on the error when the node rejects the lookup', async () => {
    mockGetTransaction.mockRejectedValue(new Error('Transaction digest not found'));

    await expect(decodeSuivmTransaction({ txHash: 'digest', chainId: exclusiveChainIds.sui, rpcUrls: [] })).rejects.toThrow('not found');
  });
});
