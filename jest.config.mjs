const shared = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    // uuid v14 is pure-ESM; this CJS shim lets Jest load @solana/web3.js without
    // "SyntaxError: Unexpected token 'export'" from uuid/dist-node/index.js
    '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
  },
};

export default {
  // Jest workers serialize results back to the parent with JSON.stringify.
  // Library code logs axios errors, whose req/res references are circular, so
  // parallel runs die with "Converting circular structure to JSON" and report
  // "Test suite failed to run" for suites that actually ran fine. Until that
  // logging is replaced with an injectable logger, run serially.
  //
  // maxWorkers is a run-level option and must live here, not inside projects —
  // Jest silently ignores per-project run options.
  maxWorkers: 1,
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      // Unit tests gate CI and must never touch the network.
      // Timeout is set via --testTimeout in the npm script: jest rejects
      // testTimeout in both root and project position when `projects` is used.
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/test/**/*.test.ts'],
      testPathIgnorePatterns: ['<rootDir>/test/unit/'],
      // These hit the live DZap API, public RPCs and Sui mainnet.
    },
  ],
};
