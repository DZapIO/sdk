export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    // @mysten/sui v3 and the packages it imports ship ESM only; Jest here runs CJS, so they are compiled to CJS on load
    '^.+\\.m?js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'], babelrc: false, configFile: false }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(@mysten|@noble|@scure|@protobuf-ts|valibot|gql\\.tada|graphql|poseidon-lite)/)'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    // uuid v14 is pure-ESM; this CJS shim lets Jest load @solana/web3.js without
    // "SyntaxError: Unexpected token 'export'" from uuid/dist-node/index.js
    '^uuid$': '<rootDir>/test/__mocks__/uuid.js',
  },
};
