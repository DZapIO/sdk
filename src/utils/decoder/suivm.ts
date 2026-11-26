import { suiNativeToken } from '../../constants/address';
import { DecodeTransactionParameters, DecodeTransactionReturnType, TokenAmount } from '../../types/decoder';
import { querySuiGraphql, toTokenListCoinType } from '../sui/graphql';

type SuiBalanceChange = { amount: string; coinType: string | null; address: string | null };

type SuiTransactionQuery = {
  transaction: {
    sender: { address: string } | null;
    gasInput: { gasSponsor: { address: string } | null } | null;
    effects: {
      gasEffects: { gasSummary: { computationCost: string | number; storageCost: string | number; storageRebate: string | number } | null } | null;
      balanceChangesJson: SuiBalanceChange[] | null;
    } | null;
  } | null;
};

// balanceChangesJson returns every change at once: the typed `balanceChanges` connection is a
// paginated one (20 by default, 50 at most), and the sender's own change can sit past that cut
const TRANSACTION_QUERY = `query ($digest: String!) {
  transaction(digest: $digest) {
    sender { address }
    gasInput { gasSponsor { address } }
    effects {
      gasEffects { gasSummary { computationCost storageCost storageRebate } }
      balanceChangesJson
    }
  }
}`;

export const decodeSuivmTransaction = async ({ txHash }: DecodeTransactionParameters): DecodeTransactionReturnType => {
  const data = await querySuiGraphql<SuiTransactionQuery>(TRANSACTION_QUERY, { digest: txHash });

  const transaction = data?.transaction;
  const sender = transaction?.sender?.address;
  const balanceChanges = transaction?.effects?.balanceChangesJson;
  if (!sender || !balanceChanges) {
    return undefined;
  }

  // the sender's SUI balance change is net of the gas it paid, which was not traded. a sponsored
  // transaction's gas is paid by its sponsor, so the sender's balance change is the trade alone
  const gasUsed = transaction?.effects?.gasEffects?.gasSummary;
  const senderPaidGas = (transaction?.gasInput?.gasSponsor?.address ?? sender) === sender;
  const gasCost =
    gasUsed && senderPaidGas
      ? BigInt(gasUsed.computationCost ?? 0) + BigInt(gasUsed.storageCost ?? 0) - BigInt(gasUsed.storageRebate ?? 0)
      : BigInt(0);

  const sent: TokenAmount[] = [];
  const received: TokenAmount[] = [];
  balanceChanges.forEach((change) => {
    const coinType = change.coinType;
    if (!coinType || change.address !== sender) return;

    const token = toTokenListCoinType(coinType);
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
