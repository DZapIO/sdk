# DZap SDK Hardening — Reference Document

**Status:** Draft for sign-off · **Branch:** `fix/sdk-integration-readiness` · **Scope:** `@dzapio/sdk` only
(`@dzapio/wallet` and `@dzapio/widget` are deliberately out of scope; they live in the widget repo.)

**Goal:** a stable, secure, easy-to-integrate, AI/vibecode-friendly SDK.

**Benchmark:** [`@lifi/sdk`](https://github.com/lifinance/sdk) v4.7.0 — the closest comparable
(bridge/DEX aggregation, multi-VM, TypeScript, same integrator audience).

> Every number below is reproducible. Commands are in [§10](#10-how-to-reproduce-every-number).
> Claims not verified are explicitly marked **UNVERIFIED**.

---

## 1. Executive summary

| Metric | `@dzapio/sdk` 2.0.50 | `@lifi/sdk` 4.7.0 | Delta |
| --- | --- | --- | --- |
| Declared runtime deps | 9 | **1** (`@lifi/types`) | 9× |
| Total resolved tree (core alone) | **719** | **2** | **360×** |
| Core + EVM + viem (fair comparison) | 719 | **16** | **45×** |
| Core + EVM + Solana + BTC + Sui (their max) | n/a | **111** | ours is 6.5× bigger than their *maximum* |
| `npm audit` | **25** (3 critical, 5 high, 17 moderate) | **0** | — |
| Duplicate multi-version packages | `ws`×4, `debug`×3, `commander`×3, … | **0** | — |
| CI | **none** (no `.github/`) | tests + publish + release | — |
| Publish provenance | **none** | OIDC trusted publishing + `NPM_CONFIG_PROVENANCE` | — |
| Typed error classes | **0** | 8 classes, 28 numeric codes | — |
| Tests | 11 files, 0 on trade/permit paths | co-located `.unit.spec.ts` per action | — |
| `sideEffects` declared | **no** | `false` | — |
| Entrypoints | 1 monolith (122 exports) | 1 core + 6 provider packages | — |

**The single most important structural finding:** every heavy dependency we carry is confined to
thin address-validation / chain-definition utilities — **not** core trading logic. The modular split
is therefore far cheaper than the 719-package footprint suggests.

| Dependency | Files using it | What for |
| --- | --- | --- |
| `tonweb` | **1** (`src/utils/address/tonvm.ts:17`) | one call: `TonWeb.utils.Address.isValid()` |
| `@solana/web3.js` | **1** (`src/utils/address/svm.ts`) | address classification |
| `bitcoin-address-validation` | **1** (`src/utils/address/bvm.ts`) | address validation |
| `@bigmi/core` | **2** (`src/chains/**`) | chain definitions |
| `ethers` | 12 imports, but **3 runtime sites** | see §4.1 |
| `decimal.js` | 2 | amount math |
| `node-cache` | 1 | cache provider |

---

## 2. Pain points (evidence-backed)

Severity: **B**locker / **H**igh / **M**edium / **L**ow

### P1 · B · 719-package dependency tree, incl. React Native / Expo / Metro
`npm init -y` + `npm i @dzapio/sdk` resolves **719 packages**. The tree contains `react-native`,
`expo-modules-autolinking`, `metro`, `@react-native/codegen`, `hermes-parser`, `@expo/cli` — in a
package whose only root is `@dzapio/sdk`.
`tonweb@0.0.66` depends on `@ledgerhq/hw-transport-web-ble`, `-webhid`, `-webusb`, `node-fetch`,
`isomorphic-webcrypto`.
**UNVERIFIED:** the exact edge chain from a DZap dependency to `react-native` was not printed;
`tonweb → @ledgerhq/*` is the probable path.
**Why it hurts:** enterprise review fails on footprint alone; multi-minute installs; a React Native
toolchain in a backend/browser SDK is indefensible.

### P2 · B · 25 vulnerabilities, and npm's only fix is a 39-version downgrade
3 critical, 5 high, 17 moderate. Root causes: `ws` advisories reached via `ethers@5.7.2`
(`@ethersproject/providers <=5.7.2`) and `viem <=2.49.3`.
`npm audit fix --force` reports: *"Will install @dzapio/sdk@2.0.11, which is a breaking change."*
`ethers@5` is a maintenance-mode line.

### P3 · B · The documented init example is wrong and fails silently
`src/dZapClient/index.ts:114`:
```ts
public static getInstance(apiKey?: string, rpcUrlsByChainId?: Record<number, string[]>): DZapClient
```
Both the JSDoc above it (lines 107–111) **and** `README.md:50-58` show:
```ts
const clientWithRpc = DZapClient.getInstance({ 1: ['https://eth.llamarpc.com'], 42161: [...] });
```
This passes the RPC map as `apiKey`. `config.setApiKey(rpcMap)` runs, RPCs are never applied, and a
stringified object is sent as the `x-api-key` header (`src/utils/axios.ts:26`). No error is raised.
The JSDoc `@param` block documents only `rpcUrlsByChainId` and omits `apiKey` entirely.
**This is the first line of code every integrator and every AI agent writes.**

### P4 · H · Shipped CHANGELOG documents an API that has never existed
`CHANGELOG.md` is in the published tarball (`files: ["dist","README.md","CHANGELOG.md","LICENSE"]`).
Its only entry is `## [1.0.0] - 2025-07-XX` — an unreplaced placeholder date — for a package
published at **2.0.50**. It documents `getQuotes()`, `buildTxn()`, `buildAndSendTransaction()`,
`getStatus()`, `getPermitAllowance()`, `approvePermit()`. The real API is `getTradeQuotes()`,
`buildTradeTxn()`, `trade()`, `getTradeTxnStatus()`, `getAllowance()`, `approve()`.
**Every name is wrong.** 8 versions (2.0.43→2.0.50) shipped with no entries.
**AI impact:** this is training/RAG corpus. It teaches agents a fabricated API.

### P5 · H · No CI, manual publish, no provenance
No `.github/` directory exists in this repo. Publishing is `npm run build && npm publish` from a
developer machine. `_npmUser = dzapio <dezaptech@gmail.com>` (single shared account).
`dist.signatures` present (standard registry signing) but `dist.attestations` absent → **no build
provenance**. Nothing gates a publish on tests passing.

### P6 · H · No typed errors; the error handler itself can crash
`grep "extends Error" src/` → **zero matches**. `src/utils/errors.ts` returns plain objects
(`{ error, errorMsg, code, status }`), so consumers must string-match `errorMsg`.
`handleViemTransactionError` does `getErrorName(error.metaMessages[0])` with no guard — any viem
error lacking `metaMessages` throws a `TypeError` *from inside the error handler*, masking the
original failure.

### P7 · H · Tests do not cover a single value-bearing path
11 test files: 4 unit + 7 address-validation integration. Zero tests for quoting, approvals,
permits, or transaction building. `jest.config.mjs` sets no coverage collection and no thresholds.
1,330-line `dZapClient/index.ts` with 38 public methods is effectively untested.

### P8 · M · `instanceof Signer` is a latent cross-copy bug
`src/utils/index.ts:167-169`:
```ts
export const isTypeSigner = (variable: any): variable is Signer => variable instanceof Signer;
```
This is the discriminator branching ethers vs viem in **7** call sites. `instanceof` fails across
duplicate package copies — and duplicates are already proven in the consumer tree. A valid ethers
Signer from a second `ethers` copy silently takes the viem branch and fails confusingly.
**UNVERIFIED as an observed failure** — reproduce with a test before changing.

### P9 · M · Not tree-shakeable
No `sideEffects` field in `package.json`. One entrypoint, 122 exported symbols, no subpath exports.
A consumer calling `getTokenPrices` pays for the whole ~400KB bundle.

### P10 · M · README points at files that are not published
`README.md:346`: *"All input/output types are defined in the SDK's `src/types` directory."*
`src/` is excluded by both `.npmignore` and `files`. npm consumers have no `src/`. The real answer —
a 95KB `dist/index.d.ts` — is never mentioned. (LI.FI solves this by *shipping `src/**/*.ts`*; see §4.4.)

### P11 · M · Singleton config is the pattern LI.FI abandoned
`DZapClient.getInstance()` + module-global `config` (`src/config/index.ts`) means one API key and one
RPC map per process. LI.FI moved from module-level `createConfig` (v3) to explicit
`createClient({ integrator, providers })` (v4) precisely to avoid this. Blocks multi-tenant/server use.

### P12 · L · Library logs to console unconditionally
61 `console.*` calls in `src/`. **No keys or mnemonics are logged** (verified). But
`console.log({ receipt })`, `console.log({ error })`, `console.dir(...)`, a bare
`console.log(uuid)` (`src/utils/index.ts:159`), and raw signature-generation errors
(`eip2612Permit.ts:179`, `permit2/index.ts:110`) ship in library code.

### P13 · L · `prepare` script breaks git-URL installs
`"prepare": "husky install && yarn run fix-permissions"` — `scripts/` is not published, so a
git-dependency install runs husky in the consumer repo and then fails on the missing script.

---

## 3. What LI.FI does that we do not

### 3.1 Modular provider architecture (the core lesson)
Core `@lifi/sdk` has **one** dependency. Ecosystem support is opt-in:

```
@lifi/sdk                       → 1 dep   (API client + execution logic, zero chain libs)
@lifi/sdk-provider-ethereum     + viem
@lifi/sdk-provider-solana       + @wallet-standard/base
@lifi/sdk-provider-bitcoin      + @bigmi/core
@lifi/sdk-provider-sui          + @mysten/sui
@lifi/sdk-provider-tron / -stellar
```

Consumers install only what they use. The ecosystem library is a **peer** the consumer constructs,
because the consumer owns the wallet object.

### 3.2 Explicit client, standalone actions
```ts
const client = createClient({ integrator: 'YourApp', providers: [EthereumProvider({ getWalletClient })] })
const quote  = await getQuote(client, { fromChain: ChainId.ARB, ... })
```
Actions are standalone functions taking `client` as the first argument — one file per action
(`getQuote.ts`, `getRoutes.ts`, `getStatus.ts`, … ~20 of them), each with a co-located
`getQuote.unit.spec.ts`. Fully tree-shakeable. Ours is a 38-method class behind a singleton.

### 3.3 Structured error model
`BaseError extends Error` carrying `name`, a numeric `code`, and `cause`, with root-cause stack
hoisting. `ErrorName` (12 values) + `LiFiErrorCode` (28 numeric codes, 1000–1027) +
`ErrorMessage`. Concrete subclasses: `RPCError`, `ProviderError`, `TransactionError`,
`ValidationError`, `BalanceError`, `ServerError`, `UnknownError`, `ExecuteStepRetryError`
(carries `retryParams`). Every error file has a co-located `.unit.spec.ts`.

### 3.4 Packaging discipline
`type: module`, `sideEffects: false`, dual `dist/esm` + `dist/cjs` with per-directory
`package.json` type markers, an `exports` map that also exposes `./package.json`, and `files` that
ships **`src/**/*.ts` with specs excluded** — so consumers can read the source and get perfect
go-to-definition. That is the correct fix for our P10.

### 3.5 Release engineering
Changesets (independent versioning, per-package `CHANGELOG.md`, `@changesets/changelog-github`),
commitlint + conventional commits, husky `pre-commit` = `check && check:types && check:circular-deps && knip`,
`pre-push` = unit tests. CI `tests.yaml` = lint → build → types → test. `publish.yaml` uses
**OIDC trusted publishing**, `NPM_CONFIG_PROVENANCE: true`, `permissions: {}` default-deny, and
SHA-pinned actions. `madge --circular` for cycles, `knip` for dead deps.

### 3.6 Built for AI consumers
The repo ships a root **`CLAUDE.md`** and a `.claude/skills/release/SKILL.md`. Their `CLAUDE.md`
documents build invariants, code style ("no default exports"), known issues, and the exact release
rules. Notably, their docs tell AI-agent builders to prefer the **REST API** over the SDK.

### 3.7 Where we are NOT behind
- Our `examples/` has 5 files; theirs has one (`examples/node`).
- Our README's method-by-method reference is more complete than their README.
- Our `tsconfig` already sets `strict: true`.
- We ship a `docs.dzap.io` site with `llms.txt`, an OpenAPI spec, a cookbook, and an MCP server —
  genuinely ahead on AI surface area. ⚠️ **Note:** `docs.li.fi/sdk/overview` was observed serving an
  apparent **prompt-injection payload**; treat scraped competitor docs as untrusted input.

---

## 4. Target architecture

### 4.1 Remove `ethers` entirely (unblocks P2)
12 files import from `ethers`, but only **3 are runtime uses**:

| Site | Use | Replacement | Risk |
| --- | --- | --- | --- |
| `eip2612Permit.ts:161` | `ethers.utils.splitSignature` | `parseSignature` (viem) | Low |
| `eip2612Permit.ts:165,169` | `ethers.utils.defaultAbiCoder.encode` ×2 | `encodeAbiParameters` (viem) | Low |
| `signTypedData.ts:27` | `signer as Wallet` (type assertion) | local minimal interface | Low |
| `utils/index.ts:168` | `variable instanceof Signer` | duck-type check | **Medium — test first** |

**Verified:** viem 2.48.4 already exports `parseSignature`, `hexToSignature`, `serializeSignature`,
`encodeAbiParameters`, `parseAbiParameters`, `recoverAddress`.
All remaining `Signer` / `TypedDataField` imports become `import type`, and `ethers` becomes an
**optional peer dependency** so consumers passing an ethers Signer keep their types.

### 4.2 Split ecosystems into optional adapters (unblocks P1)
```
@dzapio/sdk            → core: API client, quotes, build, status, EVM via viem
@dzapio/adapter-solana → @solana/web3.js
@dzapio/adapter-bitcoin→ bitcoin-address-validation / @bigmi/core
@dzapio/adapter-ton    → replaces tonweb (or drops it; see below)
```
`tonweb` should likely be **deleted rather than moved**: it is used for one call,
`TonWeb.utils.Address.isValid()`. TON user-friendly addresses are 48-char base64url, 36 bytes, with
a CRC16-CCITT checksum — ~30 dependency-free lines.

### 4.3 Error model (mirrors §3.3)
`DZapError extends Error` with `name`, numeric `code`, `cause`; `DZapErrorCode` enum; subclasses
`ValidationError`, `RPCError`, `ProviderError`, `TransactionError`, `SlippageError`,
`AllowanceError`, `UserRejectedError`, `ServerError`, `UnknownError`. Exported from the root so
consumers can `instanceof`. Guard `handleViemTransactionError` against missing `metaMessages` (P6).

### 4.4 Packaging
Add `"sideEffects": false`; ship `src/**/*.ts` (specs excluded) so P10's pointer becomes true; add
subpath exports; keep dual ESM/CJS.

---

## 5. Test strategy

Non-negotiable per the agreed process: **every change ships with a test.**

- **Runner:** keep Jest for now (migrating to vitest is a separate decision).
- **Co-location:** adopt LI.FI's `*.unit.spec.ts` beside the source file.
- **HTTP:** mock with `msw` (what LI.FI uses) or nock — no live API calls in unit tests.
- **Coverage floor:** enable `collectCoverage` + thresholds in `jest.config.mjs`, enforced in CI.

Required tests, in order:

1. `getInstance` — asserts a string arg sets the API key and an object arg does **not** (P3 regression).
2. `isTypeSigner` — ethers Signer, viem WalletClient, and a **second ethers copy** (P8 repro).
3. `eip2612Permit` signature encoding — viem output must byte-match the ethers output (P2 safety net).
4. `handleViemTransactionError` — error without `metaMessages` must not throw (P6).
5. Approval-mode selection across all four `ApprovalModes` (P7).
6. TON address validation — parity with `TonWeb.utils.Address.isValid` before removing tonweb.

---

## 6. Commit plan (small, ordered, each with tests)

| # | Commit | Fixes | Test |
| --- | --- | --- | --- |
| 1 | `chore: add graft + agent tooling config` | — | n/a |
| 2 | `docs: add SDK hardening reference` | — | n/a |
| 3 | `fix: correct getInstance docs + add options overload` | P3 | test 1 |
| 4 | `docs: regenerate CHANGELOG from git history` | P4 | n/a |
| 5 | `docs: point types reference at published artifacts` | P10 | n/a |
| 6 | `build: declare sideEffects false` | P9 | bundle-size assert |
| 7 | `ci: add test/lint/build workflow` | P5 | CI green |
| 8 | `test: cover isTypeSigner incl. duplicate-copy case` | P8 | test 2 |
| 9 | `fix: guard viem error handler against missing metaMessages` | P6 | test 4 |
| 10 | `feat: typed DZapError hierarchy with stable codes` | P6 | new specs |
| 11 | `refactor: replace ethers utils with viem equivalents` | P2 | test 3 |
| 12 | `refactor: duck-type signer detection; drop ethers runtime dep` | P2/P8 | test 2 |
| 13 | `refactor: replace tonweb with dependency-free TON validation` | P1 | test 6 |
| 14 | `chore: upgrade remaining deps to latest stable` | P2 | full suite |

Commits 1–9 are low-risk. **10–14 touch signing paths** and each needs its tests landed first.

---

## 7. Decisions needed before coding

1. **Package split (P1):** full multi-package split now, or single package with `ethers`/`tonweb`
   removed first? *Recommendation: remove `ethers` + `tonweb` first (biggest win, lowest risk),
   defer the split.*
2. **`ethers` as optional peer, or dropped outright?** Dropping is a **breaking change** for
   consumers passing ethers Signers → requires a major version.
3. **Version target:** these fixes are `2.0.51` patches, or cut **`3.0.0`** and do it properly?
   *Recommendation: 3.0.0 with a migration guide — several fixes are breaking by nature.*
4. **Adopt changesets + commitlint** now, or after the code work?
5. **Jest → vitest?** LI.FI uses vitest; our jest config already needs a `uuid` CJS shim hack.

---

## 8. Out of scope

`@dzapio/wallet`, `@dzapio/widget` (separate repo). Two known widget-repo issues recorded here so
they are not lost:
- Widget `README.md:28-33` tells users to `npm install @dzapio/widget@beta`, but dist-tags are
  `{ beta: 0.0.1-beta.0, latest: 0.2.0 }` — the documented command installs a stale pre-release.
- `examples/next` has no `.env.example` despite the README requiring `NEXT_PUBLIC_WC_PROJECT_ID`.

---

## 9. Explicitly unverified

- Exact dependency edge chain from a DZap dep to `react-native`/`expo` (P1).
- Full inventory of *deprecated* transitive packages — `npm install --package-lock-only` does not
  emit deprecation warnings, so the original "deprecated transitive dependencies" report is
  neither confirmed nor refuted.
- Whether `tonweb` / `@bigmi/core` / `bitcoin-address-validation` are bundled into `dist` (they are
  absent from the tsup `external` list, but the grep was inconclusive).
- `npmjs.com` package pages (HTTP 403); registry API was used instead.
- P8 as an *observed* failure rather than a structural hazard.

---

## 10. How to reproduce every number

```bash
# Our tree (719 packages, 25 vulns)
d=$(mktemp -d); cd "$d"; npm init -y >/dev/null
npm i @dzapio/sdk --package-lock-only --ignore-scripts --no-audit --no-fund
node -e "console.log(Object.keys(require('./package-lock.json').packages).filter(Boolean).length)"
npm audit --package-lock-only

# LI.FI core (2 packages, 0 vulns)
d=$(mktemp -d); cd "$d"; npm init -y >/dev/null
npm i @lifi/sdk --package-lock-only --ignore-scripts --no-audit --no-fund
node -e "console.log(Object.keys(require('./package-lock.json').packages).filter(Boolean).length)"

# LI.FI core + EVM + viem (16) · + Solana/BTC/Sui (111)
npm i @lifi/sdk @lifi/sdk-provider-ethereum viem --package-lock-only --ignore-scripts

# Dependency usage in our source
grep -rn "from 'ethers'" src --include='*.ts'
grep -rn "tonweb\|TonWeb" src --include='*.ts'

# viem replacement availability
node -e "const v=require('viem');console.log(['parseSignature','encodeAbiParameters'].map(f=>f+':'+typeof v[f]))"
```

> `--package-lock-only --ignore-scripts` resolves metadata only: nothing is downloaded into a
> consumer project and no install scripts execute.
