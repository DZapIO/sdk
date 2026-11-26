import { suiNativeToken } from '../../constants/address';
import { DecodeTransactionParameters, DecodeTransactionReturnType, TokenAmount } from '../../types/decoder';
import type { SuiGrpcClient } from '@mysten/sui/grpc';
import { toTokenListCoinType } from '../sui/graphql';

export const SUI_GRPC_URL = 'https://fullnode.mainnet.sui.io:443';

let client: Promise<SuiGrpcClient> | undefined;

// @mysten/sui v3 is ESM-only: a dynamic import keeps it out of the CJS build's require graph and loads it only for Sui decoding
const getClient = () =>
  (client ??= import('@mysten/sui/grpc').then(({ SuiGrpcClient }) => new SuiGrpcClient({ network: 'mainnet', baseUrl: SUI_GRPC_URL })));

export const decodeSuivmTransaction = async ({ txHash }: DecodeTransactionParameters): DecodeTransactionReturnType => {
  const result = await (await getClient()).getTransaction({ digest: txHash, include: { balanceChanges: true, effects: true, transaction: true } });

  const transaction = result.Transaction ?? result.FailedTransaction;
  const sender = transaction?.sender;
  const balanceChanges = transaction?.balanceChanges;
  if (!sender || !balanceChanges) {
    return undefined;
  }

  // the sender's SUI balance change is net of the gas it paid, which was not traded. a sponsored
  // transaction's gas is paid by its sponsor, so the sender's balance change is the trade alone
  const gasUsed = transaction.effects?.gasUsed;
  const senderPaidGas = (transaction.transaction?.gasData.owner ?? sender) === sender;
  const gasCost =
    gasUsed && senderPaidGas
      ? BigInt(gasUsed.computationCost ?? 0) + BigInt(gasUsed.storageCost ?? 0) - BigInt(gasUsed.storageRebate ?? 0)
      : BigInt(0);

  const sent: TokenAmount[] = [];
  const received: TokenAmount[] = [];
  balanceChanges.forEach((change) => {
    if (change.address !== sender) return;

    const token = toTokenListCoinType(change.coinType);
    const amount = BigInt(change.amount) + (token === suiNativeToken ? gasCost : BigInt(0));
    if (amount < BigInt(0)) {
      sent.push({ token, amount: -amount });
    } else if (amount > BigInt(0)) {
      received.push({ token, amount });
    }
  });

  if (sent.length === 0 && received.length === 0) {
    return undefined;
  }
  return { sent, received };
};
