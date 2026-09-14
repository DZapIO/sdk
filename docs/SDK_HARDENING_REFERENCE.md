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

| Metric                                      | `@dzapio/sdk` 2.0.50                     | `@lifi/sdk` 4.7.0                                 | Delta                                    |
| ------------------------------------------- | ---------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Declared runtime deps                       | 9                                        | **1** (`@lifi/types`)                             | 9×                                       |
| Total resolved tree (core alone)            | **719**                                  | **2**                                             | **360×**                                 |
| Core + EVM + viem (fair comparison)         | 719                                      | **16**                                            | **45×**                                  |
| Core + EVM + Solana + BTC + Sui (their max) | n/a                                      | **111**                                           | ours is 6.5× bigger than their _maximum_ |
| `npm audit`                                 | **25** (3 critical, 5 high, 17 moderate) | **0**                                             | —                                        |
| Duplicate multi-version packages            | `ws`×4, `debug`×3, `commander`×3, …      | **0**                                             | —                                        |
| CI                                          | **none** (no `.github/`)                 | tests + publish + release                         | —                                        |
| Publish provenance                          | **none**                                 | OIDC trusted publishing + `NPM_CONFIG_PROVENANCE` | —                                        |
| Typed error classes                         | **0**                                    | 8 classes, 28 numeric codes                       | —                                        |
| Tests                                       | 11 files, 0 on trade/permit paths        | co-located `.unit.spec.ts` per action             | —                                        |
| `sideEffects` declared                      | **no**                                   | `false`                                           | —                                        |
| Entrypoints                                 | 1 monolith (122 exports)                 | 1 core + 6 provider packages                      | —                                        |

**The single most important structural finding:** every heavy dependency we carry is confined to
thin address-validation / chain-definition utilities — **not** core trading logic. The modular split
is therefore far cheaper than the 719-package footprint suggests.

| Dependency                   | Files using it                          | What for                                   |
| ---------------------------- | --------------------------------------- | ------------------------------------------ |
| `tonweb`                     | **1** (`src/utils/address/tonvm.ts:17`) | one call: `TonWeb.utils.Address.isValid()` |
| `@solana/web3.js`            | **1** (`src/utils/address/svm.ts`)      | address classification                     |
| `bitcoin-address-validation` | **1** (`src/utils/address/bvm.ts`)      | address validation                         |
| `@bigmi/core`                | **2** (`src/chains/**`)                 | chain definitions                          |
| `ethers`                     | 12 imports, but **3 runtime sites**     | see §4.1                                   |
| `decimal.js`                 | 2                                       | amount math                                |
| `node-cache`                 | 1                                       | cache provider                             |

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
`npm audit fix --force` reports: _"Will install @dzapio/sdk@2.0.11, which is a breaking change."_
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
error lacking `metaMessages` throws a `TypeError` _from inside the error handler_, masking the
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

`README.md:346`: _"All input/output types are defined in the SDK's `src/types` directory."_
`src/` is excluded by both `.npmignore` and `files`. npm consumers have no `src/`. The real answer —
a 95KB `dist/index.d.ts` — is never mentioned. (LI.FI solves this by _shipping `src/**/*.ts`_; see §4.4.)

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

| Site                       | Use                                      | Replacement                  | Risk                    |
| -------------------------- | ---------------------------------------- | ---------------------------- | ----------------------- |
| `eip2612Permit.ts:161`     | `ethers.utils.splitSignature`            | `parseSignature` (viem)      | Low                     |
| `eip2612Permit.ts:165,169` | `ethers.utils.defaultAbiCoder.encode` ×2 | `encodeAbiParameters` (viem) | Low                     |
| `signTypedData.ts:27`      | `signer as Wallet` (type assertion)      | local minimal interface      | Low                     |
| `utils/index.ts:168`       | `variable instanceof Signer`             | duck-type check              | **Medium — test first** |

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

| #   | Commit                                                          | Fixes | Test               |
| --- | --------------------------------------------------------------- | ----- | ------------------ |
| 1   | `chore: add graft + agent tooling config`                       | —     | n/a                |
| 2   | `docs: add SDK hardening reference`                             | —     | n/a                |
| 3   | `fix: correct getInstance docs + add options overload`          | P3    | test 1             |
| 4   | `docs: regenerate CHANGELOG from git history`                   | P4    | n/a                |
| 5   | `docs: point types reference at published artifacts`            | P10   | n/a                |
| 6   | `build: declare sideEffects false`                              | P9    | bundle-size assert |
| 7   | `ci: add test/lint/build workflow`                              | P5    | CI green           |
| 8   | `test: cover isTypeSigner incl. duplicate-copy case`            | P8    | test 2             |
| 9   | `fix: guard viem error handler against missing metaMessages`    | P6    | test 4             |
| 10  | `feat: typed DZapError hierarchy with stable codes`             | P6    | new specs          |
| 11  | `refactor: replace ethers utils with viem equivalents`          | P2    | test 3             |
| 12  | `refactor: duck-type signer detection; drop ethers runtime dep` | P2/P8 | test 2             |
| 13  | `refactor: replace tonweb with dependency-free TON validation`  | P1    | test 6             |
| 14  | `chore: upgrade remaining deps to latest stable`                | P2    | full suite         |

Commits 1–9 are low-risk. **10–14 touch signing paths** and each needs its tests landed first.

---

## 7. Decisions needed before coding

1. **Package split (P1):** full multi-package split now, or single package with `ethers`/`tonweb`
   removed first? _Recommendation: remove `ethers` + `tonweb` first (biggest win, lowest risk),
   defer the split._
2. **`ethers` as optional peer, or dropped outright?** Dropping is a **breaking change** for
   consumers passing ethers Signers → requires a major version.
3. **Version target:** these fixes are `2.0.51` patches, or cut **`3.0.0`** and do it properly?
   _Recommendation: 3.0.0 with a migration guide — several fixes are breaking by nature._
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
- Full inventory of _deprecated_ transitive packages — `npm install --package-lock-only` does not
  emit deprecation warnings, so the original "deprecated transitive dependencies" report is
  neither confirmed nor refuted.
- Whether `tonweb` / `@bigmi/core` / `bitcoin-address-validation` are bundled into `dist` (they are
  absent from the tsup `external` list, but the grep was inconclusive).
- `npmjs.com` package pages (HTTP 403); registry API was used instead.
- P8 as an _observed_ failure rather than a structural hazard.

---

## 9b. Findings discovered during implementation

These were not visible from static review and change the plan.

### D1 · The test suite has zero unit tests and zero HTTP mocks

All 11 original test files hit live networks — the DZap API, public RPCs, Sui mainnet. My first
classification pass wrongly marked `quotes`/`status`/`build` as offline because they reach the
network *through* `DZapClient` rather than importing `axios` directly. `msw`, `nock` and
`jest.mock` appear nowhere in `test/`. There is therefore no test that can gate a merge.

### D2 · Jest workers crash on circular axios objects

Running the suite in parallel produces `TypeError: Converting circular structure to JSON` and
`Test suite failed to run`. The cause is jest-worker serializing a console-logged axios error
(`req` ↔ `res` cycle) back to the parent process — i.e. pain point **P12** directly breaking the
test runner. `--runInBand` eliminates it completely (11 suites run, 39 tests). Baseline with
`--runInBand`: 3 suites / 5 tests fail, all genuine live-API flakiness.

### D3 · `tsc --noEmit` cannot be used as a CI gate as-is

362 errors, **all** from `node_modules` (`ox`, a viem transitive), 0 first-party. They are
`TS2737: BigInt literals are not available when targeting lower than ES2020` against
`tsconfig.json`'s `target: es2017`. `skipLibCheck: true` does not help because `ox` ships raw
`.ts`, and `exclude` does not stop files reachable via imports. Fix: raise `target` to `ES2020`+.
Deferred to its own commit because it changes emit semantics.

### D6 · P8 CONFIRMED — `instanceof Signer` observed returning false for a real signer

P8 was filed as a structural hazard I had reasoned about but **not** reproduced. It has now
reproduced, in plain Node with no TypeScript and no test framework involved:

```
$ node -e "const {Wallet,Signer}=require('ethers'); \
           console.log(new Wallet(KEY) instanceof Signer)"
false                                    # ethers 5.7.2
```

**Provenance, stated honestly:** this surfaced after a `yarn install` failed partway
(`ENOENT … find-up`) and mixed a yarn-style layout into a pnpm-managed `node_modules`, producing
more than one copy of `ethers`. It is therefore a *corrupted-install* reproduction, not a clean
consumer scenario. That does not weaken the finding — it demonstrates the exact mechanism that bites
a consumer whenever a bundler or package manager resolves two copies of `ethers`, which the
dependency audit already proved happens (235 duplicated packages in the wallet tree, including
`viem` at three versions).

**Consequence in production:** `isTypeSigner` is the discriminator for all 7 ethers/viem branches.
When it wrongly returns `false`, a valid ethers `Signer` is routed down the viem path and signing
fails with an unrelated error — the silent, confusing failure mode the SDK should never have.

**Why the characterisation test earned its place:** the suite caught this by failing the *primary*
assertion (`recognises a real ethers signer`), not the hazard-documenting one. Had commit 8 not
landed first, this would have been invisible.

**Action:** this promotes the duck-typing migration from "nice to have" to required, and it must
not depend on `instanceof` at all. Reference implementation: check for the ethers v5 marker
(`_isSigner === true`) or the structural `_signTypedData`/`getAddress` pair.

### D5 · No lockfile is committed — builds are not reproducible

`git ls-files` tracks **no lockfile of any kind**, and `.gitignore:12` explicitly ignores
`yarn.lock`. Every install — developer, CI, or release — re-resolves the `^` ranges in
`package.json` from scratch, so two builds of the same commit can ship different transitive code.
For a package that signs financial transactions this is a supply-chain finding in its own right:
it defeats `--frozen-lockfile`, makes `npm audit` results unreproducible, and means a compromised
transitive release is picked up silently on the next install.

Compounding it, the working tree is **pnpm-managed** (`node_modules/.pnpm/` exists) while the only
lockfile on disk is a stale, untracked `yarn.lock` whose `--frozen-lockfile` check already fails.
Six of nine runtime dependencies are floating ranges.

**Fix:** commit a `pnpm-lock.yaml`, add a `packageManager` field, remove the stale `yarn.lock`, and
make CI install with `--frozen-lockfile`.

### D4 · The repository has no git tags

`git tag` is empty. No published version can be mapped to a commit, so release boundaries had to
be recovered from the `package.json` value at each bump commit. This is an auditability gap in its
own right and compounds P5 (no provenance).

---

## 10b. Work log

Each entry records what changed, why, the advantage, and measured impact.

### Commit 3 — `fix: correct getInstance contract and document it truthfully`

**Fixes:** P3 (Blocker).
**Changed:** `src/dZapClient/index.ts`, `src/index.ts`, `README.md`,
`test/unit/getInstance.unit.test.ts` (new).

**What:** Added an options-object overload `getInstance({ apiKey, rpcUrls })`; kept the positional
form; added a deprecated overload accepting a bare chain-ID map; added `TypeError` guards; exported
`DZapClientOptions`; corrected the README and JSDoc examples.

**Why:** Both the README and the JSDoc documented a call shape that put the RPC map into the
`apiKey` parameter. Requests went out unauthenticated with `[object Object]`-style values in the
`x-api-key` header and the custom RPCs were silently ignored.

**Advantage:** The failure mode is eliminated in three independent ways — the recommended form is
order-independent, the previously-wrong form now does the right thing, and genuinely invalid input
throws instead of failing silently. Integrations that copied the old docs start working on upgrade
rather than breaking.

**Design note:** A bare chain-ID map could have been left as a compile error, which is louder. It
was accepted as a deprecated RPC map instead, because the people passing that shape are precisely
the ones who followed the official documentation; breaking them to punish our own error is the
wrong trade.

**Impact:** 8 new unit tests, all passing, in 3.8s with no network. Full suite 42 passed / 47 vs
baseline 34 / 39 — same 5 pre-existing live-network failures, no regression. First offline unit
tests in the repository.

### Commit 4 — `docs: rebuild CHANGELOG from git history`

**Fixes:** P4 (High).
**Changed:** `CHANGELOG.md`.

**What:** Replaced the placeholder `[1.0.0] - 2025-07-XX` entry with entries reconstructed from
commit history for 2.0.31 → 2.0.50, plus an `Unreleased` section.

**Why:** The old file listed six method names that have never existed in this package, and it ships
inside the published tarball.

**Advantage:** Removes a fabricated API reference from the published artifact. This matters
disproportionately for AI-assisted integration: a changelog inside the tarball is high-signal
training and RAG input, so it was teaching agents to call `getQuotes()` and `buildTxn()`.

**Impact:** Documentation only, no runtime change. Version boundaries recovered from the
`package.json` value at each bump commit; the absence of tags (D4) is stated in the file rather
than papered over.

### Commit 5 — `docs: point type reference at published declarations`

**Fixes:** P10 (Medium). **Changed:** `README.md`.

**What:** Replaced the pointer to `src/types` with the bundled `dist/index.d.ts` and a concrete
`import type { … } from '@dzapio/sdk'` example.

**Why:** `src/` is excluded by both `.npmignore` and the `files` field, so an installed consumer has
no `src/` directory. The documentation sent people to a path that does not exist in the artifact
they installed.

**Advantage:** The type story now works for the only audience that matters — people who installed
from npm. Naming the root exports also makes editor autocomplete the discovery mechanism rather
than the repository.

**Impact:** Documentation only.

### Commit 6 — `build: declare sideEffects false`

**Fixes:** P9 (Medium). **Changed:** `package.json`.

**What:** Added `"sideEffects": false`.

**Why:** Without it, bundlers must conservatively assume every module has import-time side effects
and cannot eliminate unused code.

**Advantage:** This is the single highest-leverage line for consumer bundle size. A frontend
importing only `getTokenPrices` no longer has to ship the whole package. It also compounds with the
dependency work: tree-shaking can only drop `@solana/web3.js` and friends once the bundler is
permitted to reason about reachability.

**Safety:** Verified the SDK has no import-time side effects — every module only defines and
exports. Unit suite passes unchanged. Measuring the actual byte reduction requires a consumer-side
bundle and is deferred to the adapter-split work.

**Impact:** Metadata only, no runtime change.

### Commit 8 — `test: pin isTypeSigner behaviour incl. duplicate-copy hazard`

**Fixes:** Prepares P8 (Medium). **Changed:** `test/unit/isTypeSigner.unit.test.ts` (new).

**What:** Five tests pinning `isTypeSigner` against a real ethers `Wallet`, a viem-style client,
primitives, and a structurally identical signer from a foreign ethers copy.

**Why:** This function is the discriminator for all 7 ethers/viem branches. It must not be changed
without a characterisation test first.

**Advantage:** The hazard is now executable rather than theoretical. The foreign-copy test asserts
the *current* (broken) result, so the day duck-typing lands, that test fails loudly and documents
the behaviour change instead of silently passing.

**Impact:** 5 tests, offline, no production change.

### Commit 9 — `fix: guard viem error handler against missing metaMessages`

**Fixes:** P6 (High), partially. **Changed:** `src/utils/errors.ts`,
`test/unit/errors.unit.test.ts` (new).

**What:** `metaMessages` is treated as optional; `errMsg` falls back `shortMessage → message →
'Transaction failed'`; `BridgeCallFailed` extraction survives a missing second element.

**Why:** The handler threw a `TypeError` on any viem error class lacking `metaMessages`. An error
handler that crashes is worse than no error handler — it replaces a real, actionable transaction
failure with an unrelated crash from inside the SDK.

**Advantage:** Failures now surface the actual cause. This is the difference between an integrator
seeing "insufficient funds" and seeing "Cannot read properties of undefined (reading '0')" from
inside a dependency.

**Impact:** 11 tests covering the crash paths and pinning existing user-rejection and
wallet-RPC-failure classification. Zero first-party type errors; lint clean (2 pre-existing
`no-explicit-any` warnings on lines 28 and 72, untouched).

**Still open for P6:** typed `DZapError` classes with stable codes (commit 10) — this commit only
stops the handler crashing.

### Commit 7 — CI, test split, and reproducible installs

**Fixes:** P5 (High), P7 (partially), D2, D3, D5.
**Changed:** `jest.config.mjs`, `package.json`, `tsconfig.json`, `.gitignore`,
`.github/workflows/test.yml` (new), `pnpm-lock.yaml` (new).

**What:**

- Split the suite into two jest `projects`: `unit` (`test/unit/**`, offline, gates CI) and
  `integration` (everything else — live DZap API, public RPCs, Sui mainnet, advisory only).
- Pinned `maxWorkers: 1` at run level. Jest serializes worker results with `JSON.stringify`, and
  library code logs axios errors whose `req`/`res` references are circular, so parallel runs died
  with `Converting circular structure to JSON` and falsely reported "Test suite failed to run".
- Moved `testTimeout` to CLI flags: jest rejects it in **both** root and project position when
  `projects` is used, which is undocumented and cost a debugging cycle.
- Made `tsc --noEmit` usable as a CI gate: **362 dependency errors → 0**. Two separate causes, and
  I got the second one wrong the first time:
  - `target: es2017` → `ES2020` cleared 360 `TS2737` "BigInt literals are not available" errors.
  - The last 2 (`TS4113` on `override cause`, `TS2554` on `new Error(msg, { cause })`) were **not**
    target-related at all. They were `lib: ["ES2021", "DOM"]` missing `Error.cause`, which is
    ES2022. `lib` → `ES2022` cleared both.
  - I predicted the viem 2.48.4 → 2.56.5 upgrade would fix these, since it moves `ox`
    0.14.20 → 0.14.44. **It did not** — both errors survived the upgrade unchanged. The upgrade is
    retained on its own merit (it is the fix for P2's `ws` advisory), not for this.
- First CI workflow in the repository: lint → types → build → unit tests, with integration
  advisory. Actions pinned by commit SHA (a tag can be moved after review) and `permissions: {}`
  default-deny.
- Committed `pnpm-lock.yaml` and stopped ignoring lockfiles.

**Why CI uses pnpm, not yarn:** the working tree was already pnpm-managed while the only lockfile
on disk was an untracked, stale `yarn.lock` that failed `--frozen-lockfile`. Running `yarn install`
against that tree corrupted it — see D6.

**Advantage:** a merge can now be blocked by something. Before this, nothing gated a publish: no
tests, no lint, no typecheck. The unit/integration split is what makes the gate *credible* — a gate
that goes red because a third-party RPC is down gets ignored within a week.

**Impact:** unit suite 24/24 green in ~7s with no network. Typecheck 0 first-party errors. Build
clean (`dist/index.mjs` 390.97 KB, `dist/index.d.ts` 93.46 KB).

**Honest caveat:** this commit's own verification was briefly invalidated by the corrupted install
in D6. Every number above was re-measured on a clean `pnpm install` afterwards.

**Second caveat — I shipped a bug in this workflow and caught it late.** The file was rewritten to
use `yarn` while I believed `yarn.lock` was authoritative. Once `pnpm-lock.yaml` was committed and
`yarn.lock` deleted, that workflow would have failed at the install step. It is now pnpm, and
`pnpm/action-setup` deliberately specifies no `version:` so it reads `packageManager` from
`package.json` and CI cannot drift from local.

### Commit 7a — `style: fix pre-existing prettier violations blocking CI`

**Fixes:** prerequisite for P5. **Changed:** `src/enums/index.ts`, `src/utils/index.ts`.

**What:** Four `prettier/prettier` errors — quoted enum keys and a missing parenthesis pair in a
modulo expression — fixed with `eslint --fix`.

**Why separate:** these are **pre-existing**, verified identical at the branch point `1b00384`
(4 errors before any of my changes). They are not related to the CI work, but `lint` is the first
step of the new workflow, so CI would have been red on arrival — the exact failure I criticised in
the review. Fixing them in their own commit keeps the debt visible instead of burying it inside an
unrelated change.

**Verification:** the diff is 4 lines across 2 files and is formatting-only.
`r = (d + r) % 16 | 0` became `r = ((d + r) % 16) | 0` — explicit parenthesisation of the *existing*
precedence, since `%` already binds tighter than `|`. The enum change leaves both key and value
identical. Because these lines sit inside `generateUUID`, precedence equality and runtime output
were both checked rather than assumed.

**Full CI sequence verified locally, in workflow order:** `lint` PASS → `check:types` PASS →
`build` PASS → `test:unit` 24/24. Workflow file: valid YAML, 0 yarn references, 6 SHA-pinned
actions, 0 unpinned.

### Commit 11 — `refactor: replace ethers signature/ABI helpers with viem`

**Fixes:** P2 (prerequisite for dropping `ethers`).
**Changed:** `src/utils/eip-2612/eip2612Permit.ts`, `test/unit/permitEncoding.unit.test.ts` (new).

**What:** `ethers.utils.splitSignature` → `parseSignature`;
`ethers.utils.defaultAbiCoder.encode` (×2) → `encodeAbiParameters`.

**Why:** `getEIP2612PermitSignature` was the last runtime use of `ethers` outside
`isTypeSigner`. viem is already a dependency and already imported in this file, so the swap
removes a 30-package subtree without adding anything.

**The hazard this nearly hid — worth reading before touching any signing code.** viem's
`parseSignature` returns `v` as a **bigint** (`27n`/`28n`) *and* exposes `yParity` (`0`/`1`).
Encoding `yParity` where a contract expects `uint8 v` does not throw: it produces a signature that
ecrecovers to the **wrong address**. The permit is then either rejected on-chain or, worse,
validated against parameters the user never agreed to. `v` is converted with `Number(sig.v)` and a
test pins that `v !== yParity`.

**Method:** the six equivalence tests were written and **green before** the refactor, asserting
byte-identical output from ethers and viem across the v1/non-zap long form, the v2/zap short form,
and `maxUint256`. The refactor was only made once both implementations were proven to agree.

**Advantage:** removes the `@ethersproject/*` tree (30 packages) and the `ws` advisory path behind
P2's 3 critical / 5 high findings, with on-chain-equivalent output rather than a hopeful swap.

**Impact:** 0 type errors, 30/30 unit tests across 4 suites, 0 lint errors.

**State after this commit:** exactly **one** runtime use of `ethers` remains repo-wide —
`variable instanceof Signer` at `src/utils/index.ts:168`. The other 11 imports are `Signer` /
`TypedDataField` in pure type position. Commit 12 removes that last one, after which `ethers` can
leave `dependencies` entirely.

### Commit 12 — `fix: detect ethers signers structurally, not with instanceof`

**Fixes:** P8 (confirmed in D6). **Changed:** `src/utils/index.ts`,
`test/unit/isTypeSigner.unit.test.ts`.

**What:** `variable instanceof Signer` → a structural check: `_isSigner === true`, falling back to
the presence of `_signTypedData` **and** `getAddress`. The `Signer` import becomes `import type`,
removing the last runtime use of `ethers` in the codebase.

**Why:** `instanceof` compares constructor identity. A valid signer from a second copy of `ethers`
fails it — observed in this repo with three copies installed simultaneously (D6). ethers v5 sets
`_isSigner = true` on the prototype for precisely this purpose; it is what `Signer.isSigner()`
checks internally, so this is the library's own sanctioned mechanism rather than a guess.

**A test expectation was deliberately flipped.** Commit 8's characterisation test asserted that a
foreign-copy signer returns `false`, with a comment saying that if it ever returned `true` the
migration had landed. It now asserts `true`. That is the intended signal, changed knowingly and
recorded here — not a test bent to fit an implementation.

**Over-matching guarded:** a bare `{ getAddress }` object must still be rejected, and viem's
`WalletClient` — which has neither `_isSigner` nor `_signTypedData` — must continue to return
`false`, or every EVM transaction would route down the wrong branch. Both are pinned by tests.

**Advantage:** removes a silent, environment-dependent failure in the signing path, and unblocks
removing `ethers` from `dependencies` entirely (30-package `@ethersproject/*` subtree plus the `ws`
advisory path).

### Commit 13 — `refactor: replace tonweb with a dependency-free TON validator`

**Fixes:** P1 (Blocker) — the single highest-value change in this branch.
**Changed:** `src/utils/address/tonAddress.ts` (new), `src/utils/address/tonvm.ts`,
`test/unit/tonAddress.unit.test.ts` (new), `package.json`, `pnpm-lock.yaml`.

**What:** `TonWeb.utils.Address.isValid` → ~120 dependency-free lines supporting both address
forms, with CRC-16/XMODEM computed exactly as tonweb did, and base64 decoded without `Buffer` or
`atob` so one code path serves Node and the browser.

**Why it mattered so much:** `tonweb` was used for **one call** and cost **558 of 671** transitive
packages — 83% of the tree for a single address check.

**It also answered an open question.** P1 recorded that a backend/browser SDK was installing
`react-native`, `expo` and `metro`, but I marked the edge chain **UNVERIFIED** rather than guess.
Removing `tonweb` removes all of them (via `isomorphic-webcrypto` and `@ledgerhq/hw-transport-*`).
The hypothesis is now proven by removal, not by argument.

**Method — parity before removal:** 25 tests ran **both** implementations over every case while
tonweb was still installed, and they agreed on all: 9 valid forms (both tags, both workchains, the
test flag, raw), 12 invalid forms, a corrupted checksum, a bad tag byte, and the CRC-16/XMODEM
vector `0x31C3`. A too-permissive validator would let funds go to an address with a corrupted
checksum, which is precisely what TON's CRC exists to prevent. The comparison is gone now that
tonweb is uninstalled; the evidence lives in the commit.

**A false alarm, recorded because it nearly became a false claim.** After removal, `react-native`,
`expo` and `metro` still appeared under `node_modules/.pnpm/`. They were leftover entries in pnpm's
content-addressed store, not reachable graph nodes — absent from `pnpm-lock.yaml`, and `pnpm why`
returns nothing. Directory listings are not the dependency graph.

---

## 10a. Cumulative result

Measured on a clean consumer install (`npm install --package-lock-only --ignore-scripts`) of the
current manifest:

| Metric | Before | After | Change |
| --- | --- | --- | --- |
| Transitive packages | 719 | **113** | **−606 (−84%)** |
| Vulnerabilities | 25 | **5** | −20 |
| — critical | 3 | **0** | **eliminated** |
| — high | 5 | **2** | −3 |
| — moderate | 17 | **3** | −14 |
| `react-native` / `expo` / `metro` | present | **absent** | — |
| `ethers` | dependency | **optional peer** | — |
| `tonweb` | dependency | **removed** | — |
| Unit tests | 0 | **57** (5 suites, offline) | — |
| First-party type errors | 0 of 362 | **0 of 0** | — |
| CI | none | lint → types → build → tests | — |

For context, `@lifi/sdk` core + EVM provider + viem resolves to 16 packages. At 113 we are no
longer in a different category from the benchmark, though still well above it — the remaining gap
is `@solana/web3.js`, `@bigmi/core` and `bitcoin-address-validation`, which the adapter split
(P1, deferred) would move behind opt-in packages.

**Not claimed:** bundle size. `dist/index.js` went 392.96 → 395.34 KB. Tree-shaking had already
elided most of tonweb's inlined code, and viem 2.56.5 is larger than 2.48.4. The win here is
install footprint and vulnerability count.

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
