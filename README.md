# DZap SDK

A TypeScript/JavaScript SDK for interacting with the DZap protocol, providing utilities for DeFi operations such as swaps, bridges, DCA, and Zaps. This SDK abstracts away the complexity of contract interactions, token management, and price fetching, making it easy to build on top of DZap.

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
- [Token Approval Mechanism](#token-approval-mechanism)
- [Client Methods](#client-methods)
  - [Swap and Bridge Operations](#swap-and-bridge-operations)
    - [Quotes](#quotes)
    - [Build Transaction](#build-transaction)
    - [Build and Send Transaction](#build-and-send-transaction)
    - [Transaction Status](#status-request)
  - [Zap Operations](#zap-operations)
    - [Get Zap Quote](#get-zap-quote)
    - [Zap](#zap)
    - [Get Zap Transaction Status](#get-zap-transaction-status)
  - [Token Utilities](#token-utilities)
  - [Chain Utilities](#chain-utilities)
  - [Permit Utilities](#permit-utilities)
- [Types](#types)
- [License](#license)

---

## Initialization

```typescript
import { DZapClient } from '@dzapio/dzap-sdk';

const dZap = DZapClient.getInstance();
```

---

## Token Approval Mechanism

Before executing any transaction that spends ERC20 tokens (swap, bridge, zap, etc.), the DZap contract must be approved to access those tokens. There are two ways to do this:

1. **On-Chain Approval (Standard ERC20):**  
   You must manually call the ERC20 token contract's `approve` method, specifying the DZap router contract as the spender. To get the correct router address for a chain, use the chain config:

   ```typescript
   // Example: Fetching the router address for a chain
   const chainConfig = await DZapClient.getChainConfig();
   const routerAddress = chainConfig[CHAIN_ID].contracts?.router;
   // Use routerAddress as the spender in your ERC20 approve call
   ```

2. **Gas-less Permit-based Approval (Permit2):**  
   Use the SDK's `sign` method to generate a permit signature, and pass the resulting `permitData` to the transaction-building method. This allows for a seamless, gas-less approval experience if the token supports Permit2.
   - The SDK's `permitAllowance` and `approvePermit` methods are for Permit2/Permit-based flows only.

See the [Permit Utilities](#permit-utilities) section for code examples.

---

## Client Methods

### Swap and Bridge Operations

#### Quotes

##### `getQuotes(request: QuotesRequest): Promise<QuotesResponse>`

- **Purpose:** Fetches quotes for swaps, bridges, or other DZap services.
- **Input:**
  - `request`: `QuotesRequest` (object with details like source/destination tokens, amounts, chains, etc.)
- **Output:**
  - `Promise<QuotesResponse>` (object containing available quotes, rates, fees, etc.)
- **Description:**
  Returns the best available quotes for the requested operation, with prices updated using the SDK's price service.

---

#### Build Transaction

> **Note:** This method requires token approval. See [Token Approval Mechanism](#token-approval-mechanism).

##### `buildTxn(request: BuildTxRequest): Promise<BuildTxResponse>`

- **Purpose:** Builds a transaction payload for a swap, bridge, or other operation.
- **Input:**
  - `request`: `BuildTxRequest` (object with operation details)
- **Output:**
  - `Promise<BuildTxResponse>` (transaction data ready to be signed/sent)
- **Description:**
  Prepares the transaction data required to execute the requested operation on-chain.

---

#### Build and Send Transaction

> **Note:** This method requires token approval. See [Token Approval Mechanism](#token-approval-mechanism).

##### `buildAndSendTransaction({ chainId, request, signer, txnData })`

- **Purpose:** Builds and sends a transaction in one step.
- **Input:**
  - `chainId`: number
  - `request`: `BuildTxRequest`
  - `signer`: `Signer` or `WalletClient`
  - `txnData?`: `BuildTxResponse`
- **Output:**
  - Transaction result (depends on contract handler)
- **Description:**
  Combines building and sending a transaction for convenience.

---

#### Transaction Status

##### `getStatus({ txHash, txIds, chainId }): Promise<StatusResponse | Record<string, StatusResponse>>`

- **Purpose:** Fetches the status of a transaction (swap/bridge).
- **Input:**
  - `txHash?`: string (transaction hash)
  - `txIds?`: string (comma-separated list of `srcChainId-txHash`)
  - `chainId?`: string (chain ID)
  - **Note:** Either `txIds` OR both `txHash` and `chainId` must be provided.
- **Output:**
  - `Promise<StatusResponse | Record<string, StatusResponse>>`
- **Description:**
  Returns the status (pending, completed, failed) of one or more transactions.

---

#### Get DZap Contract Address

##### `getDZapContractAddress({ chainId, service }): Promise<string>`

- **Purpose:** Returns the contract address for a given service on a chain.
- **Input:**
  - `chainId`: number
  - `service`: `AvailableDZapServices`
- **Output:**
  - `Promise<string>`
- **Description:**  
  Fetches the address of the router, zap, or DCA contract for the specified chain/service.

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

#### Zap

> **Note:** This method requires token approval. See [Token Approval Mechanism](#token-approval-mechanism).

##### `zap({ chainId, data, signer })`

- **Purpose:** Executes a sequence of Zap steps.
- **Input:**
  - `chainId`: number
  - `data`: ZapTransactionStep[]
  - `signer`: WalletClient
- **Output:**
  - Transaction result
- **Description:**
  Runs a series of Zap steps as a single operation.

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

#### `getTokenPrice(tokenAddresses: string[], chainId: number): Promise<Record<string, string | null>>`

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

#### `permitAllowance({ chainId, sender, data, rpcUrls })`

- **Purpose:** Checks token allowances for a sender (Permit2/Permit-based only).
- **Input:**
  - `chainId`: number
  - `sender`: HexString
  - `data`: Array of `{ srcToken: HexString; amount: bigint }`
  - `rpcUrls`: string[]
- **Output:**
  - Allowance information
- **Description:**
  Returns the current allowance for each token.

---

#### `approvePermit({ chainId, signer, sender, rpcUrls, data, approvalTxnCallback })`

- **Purpose:** Approves tokens for spending (Permit2/Permit-based only).
- **Input:**
  - `chainId`: number
  - `signer`: `Signer` or `WalletClient`
  - `sender`: HexString
  - `rpcUrls?`: string[]
  - `data`: Array of `{ srcToken: HexString; amountToApprove: bigint }`
  - `approvalTxnCallback?`: callback for transaction status
- **Output:**
  - Approval transaction result
- **Description:**
  Sends approval transactions for the specified tokens.

---

#### `sign({ chainId, sender, data, rpcUrls, service, signer, spender, signatureCallback })`

- **Purpose:** Signs permit data for tokens (Permit2).
- **Input:**
  - `chainId`: number
  - `sender`: string
  - `data`: Array of `{ srcToken: string; permitData?: string; amount: string }`
  - `service`: AvailableDZapServices
  - `rpcUrls?`: string[]
  - `spender`: string
  - `signer`: `Signer` or `WalletClient`
  - `signatureCallback?`: Callback function for each signature result
- **Output:**
  - Signature result
- **Description:**
  Signs permit data for gasless approvals.

---

## Types

All input/output types are defined in the SDK's `src/types` directory. Refer to those files for detailed type definitions.

---

## Error Handling

All methods throw errors on failure. Use `try/catch` blocks to handle errors gracefully.

---

## License

MIT

---

**For more details, refer to the source code and type definitions.**  
If you have questions or need help, open an issue or contact the maintainers.
