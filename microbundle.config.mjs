export default {
  entry: 'src/index.ts',
  output: 'dist',
  format: ['esm', 'cjs', 'umd'],
  target: 'node',
  sourcemap: false,
  generateTypes: true,
  external: ['axios', 'ethers', 'node-cache', 'viem', 'viem/chains', 'decimal.js'],
  globals: {
    'axios': 'axios',
    'ethers': 'ethers', 
    'node-cache': 'NodeCache',
    'viem': 'viem',
    'viem/chains': 'viemChains',  // This matches what microbundle guessed
    'decimal.js': 'Decimal'        // This matches what microbundle guessed
  }
};
