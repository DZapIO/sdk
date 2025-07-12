# DZap SDK

A TypeScript/JavaScript SDK for interacting with the DZap protocol, providing utilities for DeFi operations such as swaps, bridges, and Zaps. This SDK abstracts away the complexity of contract interactions, token management, and price fetching, making it easy to build on top of DZap.

## Installation

```bash
npm install @dzapio/dzap-sdk
# or
yarn add @dzapio/dzap-sdk
# or
pnpm add @dzapio/dzap-sdk
```

---

## Table of Contents

- [Installation](#installation)
- [Initialization](#initialization)
- [Client Methods](#client-methods)
  - [Trade Operations](#trade-operations)
    - [Trade Quotes](#trade-quotes)
    - [Build Trade Transaction](#build-trade-transaction)
    - [Trade](#trade)
    - [Get Trade Transaction Status](#get-trade-transaction-status)
  - [Zap Operations](#zap-operations)
    - [Get Zap Quote](#get-zap-quote)
    - [Build Zap Transaction](#build-zap-transaction)
    - [Zap](#zap)
    - [Get Zap Transaction Status](#get-zap-transaction-status)
  - [Token Utilities](#token-utilities)
  - [Chain Utilities](#chain-utilities)
  - [Permit Utilities](#permit-utilities)
- [Token Approval Mechanism](#token-approval-mechanism)
- [Types](#types)
- [License](#license)

---

## Initialization

```typescript
import { DZapClient } from '@dzapio/dzap-sdk';

// Basic initialization
const dZap = DZapClient.getInstance();

// With custom RPC URLs (optional)
const customRpcUrls = {
  1: ['https://eth.llamarpc.com'], // Ethereum mainnet
  42161: ['https://arbitrum.llamarpc.com'], // Arbitrum
  // Add more chains as needed
};

// Initialize with custom RPC URLs
// This is useful if you want to use specific RPC endpoints instead of the defaults.
const dZapWithCustomRpc = DZapClient.getInstance(customRpcUrls);
```

---

## Client Methods

### Trade Operations

#### Trade Quotes

##### `getTradeQuotes(request: TradeQuotesRequest): Promise<TradeQuotesResponse>`

- **Purpose:** Fetches quotes for swaps, bridges, or other DZap services.
- **Input:**
  - `request`: `TradeQuotesRequest` (object with details like source/destination tokens, amounts, chains, etc.)
- **Output:**
  - `Promise<TradeQuotesResponse>` (object containing available quotes, rates, fees, etc.)
- **Description:**
  Returns the best available quotes for the requested operation, with prices updated using the SDK's price service.

---

#### Build Trade Transaction

> **Note:** This method requires token approval. See [Token Approval Mechanism](#token-approval-mechanism).

##### `buildTradeTxn(request: TradeBuildTxnRequest): Promise<TradeBuildTxnResponse>`

- **Purpose:** Builds a transaction payload for a swap, bridge, or other operation.
- **Input:**
  - `request`: `TradeBuildTxnRequest` (object with operation details)
- **Output:**
  - `Promise<TradeBuildTxnResponse>` (transaction data ready to be signed/sent)
- **Description:**
  Prepares the transaction data required to execute the requested operation on-chain.

---

#### Trade

> **Note:** This method requires token approval. See [Token Approval Mechanism](#token-approval-mechanism).

##### `trade({ chainId, request, signer, txnData })`

- **Purpose:** Builds and sends a trade transaction in one step.
- **Input:**
  - `chainId`: number
  - `request`: `TradeBuildTxnRequest`
  - `signer`: `Signer` or `WalletClient`
  - `txnData?`: `TradeBuildTxnResponse`
- **Output:**
  - Transaction result
- **Description:**
  Combines building and sending a transaction for convenience.

---

#### Get Trade Transaction Status

##### `getTradeTxnStatus({ txHash, txIds, chainId }): Promise<TradeStatusResponse | Record<string, TradeStatusResponse>>`

- **Purpose:** Fetches the status of a trade transaction (swap/bridge).
- **Input:**
  - `txHash?`: string (transaction hash)
  - `txIds?`: string (comma-separated list of `srcChainId-txHash`)
  - `chainId?`: string (chain ID)
  - **Note:** Either `txIds` OR both `txHash` and `chainId` must be provided.
- **Output:**
  - `Promise<TradeStatusResponse | Record<string, TradeStatusResponse>>`
- **Description:**
  Returns the status (pending, completed, failed) of one or more transactions.

---

### Zap Operations

#### Get Zap Quote

##### `getZapQuote(request: ZapQuoteRequest): Promise<ZapQuoteResponse>`

- **Purpose:** Fetches a quote for a Zap operation.
- **Input:**
  - `request`: ZapQuoteRequest
- **Output:**
  - `Promise<ZapQuoteResponse>`
- **Description:**
  Returns the best available quote for the requested Zap.

---

#### Build Zap Transaction

##### `buildZapTxn(request: ZapBuildTxnRequest): Promise<ZapBuildTxnResponse>`

- **Purpose:** Builds a zap transaction with detailed steps for execution.
- **Input:**
  - `request`: ZapBuildTxnRequest
- **Output:**
  - `Promise<ZapBuildTxnResponse>`
- **Description:**
  Prepares the transaction steps required to execute the requested Zap operation on-chain.

---

#### Zap

> **Note:** This method requires token approval. See [Token Approval Mechanism](#token-approval-mechanism).

##### `zap({ request, signer, steps })`

- **Purpose:** Builds and sends a zap transaction in one step.
- **Input:**
  - `request`: ZapBuildTxnRequest
  - `signer`: WalletClient | Signer
  - `steps?`: ZapTransactionStep[] (optional, will build if not provided)
- **Output:**
  - Transaction result
- **Description:**
  Runs a series of Zap steps as a single operation, building steps from request if not provided.

---

#### Get Zap Transaction Status

##### `getZapTxnStatus(request: ZapTxnStatusRequest): Promise<ZapTxnStatusResponse>`

- **Purpose:** Fetches the status of a Zap transaction.
- **Input:**
  - `request`: ZapTxnStatusRequest
- **Output:**
  - `Promise<ZapTxnStatusResponse>`
- **Description:**
  Returns the status of a Zap transaction (pending, completed, failed).

---

### Token Utilities

#### `getAllTokens(chainId: number, source?: string, account?: string)`

- **Purpose:** Fetches all tokens for a chain, with optional price and account info.
- **Input:**
  - `chainId`: number
  - `source?`: string
  - `account?`: string
- **Output:**
  - Token list (with prices)
- **Description:**
  Returns a list of tokens for the specified chain, with up-to-date prices.

---

#### `getTokenDetails(tokenAddress: string, chainId: number, account?: string, includeBalance?: boolean, includePrice?: boolean)`

- **Purpose:** Fetches details for a specific token.
- **Input:**
  - `tokenAddress`: string
  - `chainId`: number
  - `account?`: string
  - `includeBalance?`: boolean
  - `includePrice?`: boolean
- **Output:**
  - Token details object
- **Description:**
  Returns metadata, balance, and/or price for a token.

---

#### `getTokenPrices(tokenAddresses: string[], chainId: number): Promise<Record<string, string | null>>`

- **Purpose:** Fetches prices for a list of tokens on a chain.
- **Input:**
  - `tokenAddresses`: string[]
  - `chainId`: number
- **Output:**
  - Mapping of token address to price (as string or null)
- **Description:**
  Returns the latest prices for the specified tokens.

---

### Chain Utilities

#### `getAllSupportedChains(): Promise<ChainData>`

- **Purpose:** Fetches all supported chains and their configuration.
- **Output:**
  - `Promise<ChainData>`
- **Description:**
  Returns a mapping of chain IDs to chain configuration objects.

---

### Permit Utilities

#### `getAllowance({ chainId, sender, tokens, rpcUrls, service, mode })`

- **Purpose:** Checks token allowances for a sender with support for different approval modes.
- **Input:**
  - `chainId`: number
  - `sender`: HexString
  - `tokens`: Array of `{ address: HexString; amount: bigint }`
  - `rpcUrls?`: string[]
  - `service`: AvailableDZapServices
  - `mode?`: ApprovalMode (defaults to `ApprovalModes.AutoPermit`)
- **Output:**
  - `{ status, code, data: { tokenAllowances, noOfApprovalsRequired, noOfSignaturesRequired } }`
- **Description:**
  Returns the current allowance for each token and indicates how many approvals/signatures are needed.

---

#### `approve({ chainId, signer, sender, rpcUrls, tokens, service, mode, approvalTxnCallback })`

- **Purpose:** Approves tokens for spending based on the specified approval mode.
- **Input:**
  - `chainId`: number
  - `signer`: `Signer` or `WalletClient`
  - `sender`: HexString
  - `rpcUrls?`: string[]
  - `tokens`: Array of `{ address: HexString; amount: bigint }`
  - `service`: AvailableDZapServices
  - `mode?`: ApprovalMode (defaults to `ApprovalModes.AutoPermit`)
  - `approvalTxnCallback?`: callback for transaction status updates
- **Output:**
  - Approval transaction result
- **Description:**
  Sends approval transactions for the specified tokens. The spender is automatically determined based on the approval mode.

---

#### `sign({ chainId, sender, tokens, rpcUrls, service, signer, spender, permitType, signatureCallback })`

- **Purpose:** Signs EIP-2612Permit/Permit2 data for gas-less token approvals.
- **Input:**
  - `chainId`: number
  - `sender`: HexString
  - `tokens`: Array of `{ address: HexString; amount: string }`
  - `service`: AvailableDZapServices
  - `signer`: `Signer` or `WalletClient`
  - `spender`: HexString
  - `permitType?`: PermitMode (defaults to `PermitTypes.AutoPermit`)
  - `rpcUrls?`: string[]
  - `signatureCallback?`: Callback function for each signature result
- **Output:**
  - `{ status, code, data }` with permit signatures populated
- **Description:**
  Signs permit data for gas-less approvals. Automatically handles EIP2612 or Permit2 based on token support and permit type.

## Token Approval Mechanism

Before executing any transaction that spends ERC20 tokens (swap, bridge, zap, etc.), the DZap contract must be approved to access those tokens. The SDK provides multiple approval modes to handle different scenarios:

### Approval Modes

The SDK supports four approval modes via `ApprovalModes`:

#### 1. **Default Mode** (`ApprovalModes.Default`)

Standard ERC20 approval directly to the DZap contract.

- **How it works**: Traditional `approve()` call on the token contract
- **Gas**: Requires gas for the approval transaction
- **Spender**: DZap router/contract address
- **Use case**: Standard approval flow for all ERC20 tokens

#### 2. **Permit2 Mode** (`ApprovalModes.Permit2`)

Uses Uniswap's Permit2 for gas-less approvals.

- **How it works**: Two-step process - `approve` Permit2 contract once, then `sign` permits
- **Gas**: Initial approval to Permit2, then gas-less signatures
- **Spender**: Permit2 contract address
- **Use case**: Gas-efficient repeated transactions

#### 3. **EIP2612 Permit Mode** (`ApprovalModes.EIP2612Permit`)

Uses EIP2612 permit signatures directly to the DZap contract.

- **How it works**: Sign a permit message instead of sending approval transaction
- **Gas**: Gas-less (signature only)
- **Spender**: DZap router/contract address
- **Use case**: Tokens that support EIP2612 permits

#### 4. **Auto Permit Mode** (`ApprovalModes.AutoPermit`)

Automatically chooses between EIP2612 and Permit2 based on token support.

- **How it works**: Checks if token supports EIP2612, falls back to Permit2
- **Gas**: Gas-less if EIP2612 supported, otherwise Permit2 flow
- **Spender**: Automatically determined
- **Use case**: Best user experience with automatic optimization

### Recommended Flow

1. **Check Allowance**: Use `getAllowance()` to check if approval is needed
2. **Choose Mode**: Use `ApprovalModes.AutoPermit` for best user experience
3. **Approve if Needed**: Use `approve()` for on-chain approvals
4. **Sign if Preferred**: Use `sign()` for gas-less permit signatures
5. **Execute Transaction**: Pass permit data to transaction methods

---

## Types

All input/output types are defined in the SDK's `src/types` directory. Refer to those files for detailed type definitions.

---

## License

MIT

---

**For more details, refer to the source code and type definitions.**  
If you have questions or need help, open an issue or contact the maintainers.
