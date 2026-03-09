import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  external: [
    'ethers',
    'viem',
    'axios',
    'decimal.js',
    'node-cache',
    'viem/chains',
    'viem/utils',
    'viem/actions',
  ],
  target: 'node16',
  sourcemap: false,
  clean: true,
  splitting: false,
  treeshake: true,
  tsconfig: 'tsconfig.build.json',
});
