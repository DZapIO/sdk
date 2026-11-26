import axios from 'axios';
import { suiNativeToken } from '../../src/constants/address';
import { exclusiveChainIds } from '../../src/constants/chains';
import { decodeSuivmTransaction } from '../../src/utils/decoder/suivm';

jest.mock('axios');

const SENDER = `0x${'aa'.repeat(32)}`;
const SPONSOR = `0x${'bb'.repeat(32)}`;
const USDC = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
// GraphQL reports coin types with a padded package address; token lists spell SUI short
const SUI_PADDED = `0x${'0'.repeat(63)}2::sui::SUI`;

// a swap of 5 USDC for 2 SUI whose gas of 1000 MIST is paid by gasSponsor
const serveSwap = (gasSponsor: string) => {
  const suiChangeOfSender = gasSponsor === SENDER ? BigInt(2_000_000_000) - BigInt(1_000) : BigInt(2_000_000_000);
  (axios.post as jest.Mock).mockResolvedValue({
    status: 200,
    data: {
      data: {
        transaction: {
          sender: { address: SENDER },
          gasInput: { gasSponsor: { address: gasSponsor } },
          effects: {
            gasEffects: { gasSummary: { computationCost: 1500, storageCost: 500, storageRebate: 1000 } },
            balanceChangesJson: [
              { amount: '-5000000', coinType: USDC, address: SENDER },
              { amount: suiChangeOfSender.toString(), coinType: SUI_PADDED, address: SENDER },
              ...(gasSponsor === SENDER ? [] : [{ amount: '-1000', coinType: SUI_PADDED, address: gasSponsor }]),
            ],
          },
        },
      },
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

  it('returns undefined when the query failed', async () => {
    (axios.post as jest.Mock).mockResolvedValue({ status: 200, data: { errors: [{ message: 'boom' }] } });

    const result = await decodeSuivmTransaction({ txHash: 'digest', chainId: exclusiveChainIds.sui, rpcUrls: [] });

    expect(result).toBeUndefined();
  });
});
