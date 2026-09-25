import type { VersionedTransaction } from '@solana/web3.js';
import type { Signer } from 'ethers';
import type { WalletClient } from 'viem';

export type EvmSigner = Signer | WalletClient;

/**
 * Signs solana transactions without sending them. `useWallet()` from `@solana/wallet-adapter-react`
 * satisfies it as is, and a `Keypair` through `{ signTransaction: async (tx) => { tx.sign([keypair]); return tx; } }`.
 */
export type SvmSigner = {
  signTransaction: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
  /** used to sign a zap's jito bundle in one prompt, which is otherwise signed a tx at a time */
  signAllTransactions?: (transactions: VersionedTransaction[]) => Promise<VersionedTransaction[]>;
};

/**
 * Signs sui transaction bytes without executing them.
 * @param transaction - the base64 bcs `TransactionData` bytes the dzap api built
 * @returns the signed bytes and the serialized signature, both base64
 *
 * @example
 * ```typescript
 * // @mysten/sui keypair
 * const signer: SuiSigner = { signTransaction: (tx) => keypair.signTransaction(fromBase64(tx)) };
 * // @mysten/dapp-kit
 * const signer: SuiSigner = { signTransaction: (tx) => signTransaction({ transaction: Transaction.from(tx) }) };
 * ```
 */
export type SuiSigner = {
  signTransaction: (transaction: string) => Promise<{ bytes: string; signature: string }>;
};

export type BtcSignPsbtParams = {
  /** the psbt as a hex string */
  psbt: string;
  inputsToSign: { address: string; sigHash?: number; signingIndexes: number[] }[];
  finalize?: boolean;
};

/**
 * Signs bitcoin psbts. A `@bigmi/core` connector client fits through
 * `{ account: client.account, signPsbt: (params) => signPsbt(client, params) }`.
 */
export type BtcSigner = {
  account: { address: string; publicKey: string };
  /** @returns the signed psbt as a hex string */
  signPsbt: (params: BtcSignPsbtParams) => Promise<string>;
};

export type DZapSigner = EvmSigner | SvmSigner | SuiSigner | BtcSigner;
