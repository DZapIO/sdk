export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    // uuid v14 is pure-ESM; this CJS shim lets Jest load @solana/web3.js without
    // "SyntaxError: Unexpected token 'export'" from uuid/dist-node/index.js
    '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
  },
};
