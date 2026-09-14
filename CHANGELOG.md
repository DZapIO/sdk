# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note on history.** This repository carries no git tags, so releases before `2.0.51`
> cannot be mapped to an exact commit range. Entries below `2.0.51` are reconstructed from
> commit history and the `package.json` version recorded at each bump commit; they are
> accurate as to content and approximate as to boundaries. Going forward, every release is
> tagged and every user-facing change is recorded here at merge time.

## [Unreleased]

### Fixed

- `DZapClient.getInstance()` no longer silently misconfigures the client. The README and the
  method's own JSDoc both documented `getInstance({ 1: ['https://…'] })` while the signature was
  `getInstance(apiKey?: string, rpcUrls?: …)`. The RPC map landed in the `apiKey` slot, so requests
  were sent unauthenticated with a stringified object as the `x-api-key` header, and the custom RPC
  endpoints were never applied — with no error raised. The chain-ID-map form is now correctly
  interpreted as RPC URLs (deprecated but honoured), so affected integrations begin working rather
  than breaking.

### Added

- `getInstance()` accepts an options object: `getInstance({ apiKey, rpcUrls })`. Named fields make
  it impossible to pass an RPC map where an API key is expected. The positional form remains
  supported.
- `DZapClientOptions` is exported from the package root.
- A non-string `apiKey`, or a first argument that is neither a string nor an object, now throws a
  `TypeError` instead of failing silently.

### Changed

- The changelog is rebuilt from git history. The previous file documented a `1.0.0` release dated
  `2025-07-XX` (an unreplaced placeholder) listing methods that have never existed in this package
  — `getQuotes()`, `buildTxn()`, `buildAndSendTransaction()`, `getStatus()`, `getPermitAllowance()`,
  `approvePermit()`. The real API is `getTradeQuotes()`, `buildTradeTxn()`, `trade()`,
  `getTradeTxnStatus()`, `getAllowance()`, `approve()`. That file shipped inside the published
  tarball and was actively misleading both integrators and AI coding assistants.

---

## [2.0.50] — 2026-09-11

### Added

- `simulated` flag on quotes.
- Route refund types, fee type, and shared asset amount shapes (#136).

## [2.0.49] — 2026-09-03

### Added

- Exported custom viem and bigmi chain definitions.
- Arc testnet support.

### Changed

- Removed the Arc native token from the exported native address set.

## [2.0.46] — 2026-08-23

### Fixed

- Domain type correction for permit signing.

## [2.0.45] — 2026-08-22

### Changed

- Zap fee types updated (#126).
- Provider error types updated.

## [2.0.43] — 2026-07-20

### Added

- `unavailableRoutes` field on the trade quote response (#122).
- Robinhood chain support.
- Hyperliquid types and handling improvements.

### Fixed

- Price API request handling.

## [2.0.39] — 2026-06-07

### Added

- Underlying tokens in status assets (#111).
- Trade status response updates (#109).
- Zap status response type.

### Fixed

- EIP-7702 accounts correctly classified as contract wallets.

## [2.0.34] — 2026-05-09

### Added

- Address classification utilities.
- Types for private swap and SVM zap (#98).
- Bitcoin Lightning support (#91).

### Changed

- Trade status type refinements (#101).
- `priceImpact` made optional; build response includes updated price impact.

## [2.0.31] — 2026-04-27

### Added

- Citrea multicall (#93) and Hemi multicall (#92).
- Zap build response type updates (#89).

### Fixed

- Missing chain exports.
- EIP-2612 permit support check.
- Citrea Permit2 address.

---

## Earlier releases

Versions before `2.0.31` predate this reconstruction. See the
[commit history](https://github.com/dzapio/sdk/commits/master) for details.
