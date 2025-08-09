# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-XX

### Added
- Initial release of DZap SDK
- Support for swap and bridge operations
- Zap operations for multi-step transactions
- Token utilities for fetching token lists, details, and prices
- Chain utilities for fetching supported chains
- Permit utilities for gas-less approvals (Permit2)
- Comprehensive TypeScript support
- Full documentation and examples

### Features
- `getQuotes()` - Fetch quotes for swaps and bridges
- `buildTxn()` - Build transaction payloads
- `buildAndSendTransaction()` - Build and send transactions in one step
- `getStatus()` - Check transaction status
- `zap()` - Execute multi-step Zap operations
- `getZapQuote()` - Get quotes for Zap operations
- `getAllTokens()` - Fetch all tokens for a chain
- `getTokenDetails()` - Get detailed token information
- `getTokenPrices()` - Fetch token prices
- `getAllSupportedChains()` - Get supported blockchain networks
- `getPermitAllowance()` - Check Permit2 allowances
- `approvePermit()` - Approve tokens via Permit2
- `sign()` - Sign permit data for gas-less approvals 