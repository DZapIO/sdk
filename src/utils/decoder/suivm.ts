import axios from 'axios';
import { suiNativeToken } from '../../constants/address';
import { DecodeTransactionParameters, DecodeTransactionReturnType, TokenAmount } from '../../types/decoder';

// sui's own public fullnodes no longer serve json-rpc, so the fallback has to be a provider that does
const SUI_DEFAULT_RPC = 'https://sui-rpc.publicnode.com';

export const decodeSuivmTransaction = async ({ txHash, rpcUrls }: DecodeTransactionParameters): DecodeTransactionReturnType => {
  const rpcUrl = rpcUrls?.[0] ?? SUI_DEFAULT_RPC;
  const response = await axios.post(rpcUrl, {
    jsonrpc: '2.0',
    id: 1,
    method: 'sui_getTransactionBlock',
    params: [txHash, { showBalanceChanges: true, showEffects: true, showInput: true }],
  });
  if (response.status !== 200 || response.data?.error) {
    return undefined;
  }

  const result = response.data?.result;
  const sender: string | undefined = result?.transaction?.data?.sender;
  const balanceChanges: Array<{ owner?: { AddressOwner?: string }; coinType: string; amount: string }> | undefined = result?.balanceChanges;
  if (!sender || !balanceChanges) {
    return undefined;
  }

  // the sender's SUI balance change is net of the gas it paid, which was not traded. a sponsored
  // transaction's gas is paid by its sponsor, so the sender's balance change is the trade alone
  const gasUsed = result?.effects?.gasUsed;
  const senderPaidGas = (result?.transaction?.data?.gasData?.owner ?? sender) === sender;
  const gasCost =
    gasUsed && senderPaidGas
      ? BigInt(gasUsed.computationCost ?? 0) + BigInt(gasUsed.storageCost ?? 0) - BigInt(gasUsed.storageRebate ?? 0)
      : BigInt(0);

  const sent: TokenAmount[] = [];
  const received: TokenAmount[] = [];
  balanceChanges
    .filter((change) => change.owner?.AddressOwner === sender)
    .forEach((change) => {
      const amount = BigInt(change.amount) + (change.coinType === suiNativeToken ? gasCost : BigInt(0));
      if (amount < BigInt(0)) {
        sent.push({ token: change.coinType, amount: -amount });
      } else if (amount > BigInt(0)) {
        received.push({ token: change.coinType, amount });
      }
    });

  if (sent.length === 0 && received.length === 0) {
    return undefined;
  }
  return { sent, received };
};
