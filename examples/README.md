# DZap SDK Examples

This directory contains example TypeScript files demonstrating how to use the various methods available in the DZap SDK.

Each file is named after the category of methods it contains, as documented in the main `README.md`.

## Running the Examples

1.  **Install Dependencies:** Make sure you have `typescript` and `ts-node` installed to run these examples.
    ```bash
    npm install -D typescript ts-node
    ```

2.  **Configure:** Before running, you must replace placeholder values (like `YOUR_RPC_URL`, `YOUR_PRIVATE_KEY`, `YOUR_WALLET_ADDRESS`, etc.) with actual values.

3.  **Execute a file:** You can run any example file using `ts-node`.
    ```bash
    ts-node examples/swap-and-bridge.ts
    ```

## Files

-   `swap-and-bridge.ts`: Shows the flow for getting quotes, building transactions, and checking status.
-   `permit-utils.ts`: Demonstrates how to check allowances, approve tokens, and sign permits for gas-less approvals.
-   `zap-operations.ts`: Covers the end-to-end flow for multi-step Zap transactions.
-   `token-utils.ts`: Contains examples for fetching token lists, details, and prices.
-   `chain-utils.ts`: Shows how to fetch all chains supported by the DZap protocol. 