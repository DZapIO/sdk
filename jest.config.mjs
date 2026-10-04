import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(rootDir, 'src');

const coverageExcludedDirs = new Set(['types', 'constants', 'service', 'artifacts', 'enums', 'node_modules']);

function isImportExportOnlyFile(content) {
  const withoutComments = content.replace(/\/\/.*$/gm, '').trim();
  const withoutImportsExports = withoutComments
    .replace(/import\s+(type\s+)?[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+\*\s+from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+(type\s+)?[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s*\{[\s\S]*?\};?/g, '')
    .trim();

  return withoutImportsExports.length === 0;
}

function findImportExportOnlyFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (dir === srcDir && coverageExcludedDirs.has(entry.name)) {
        continue;
      }
      findImportExportOnlyFiles(fullPath, files);
      continue;
    }

    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
      continue;
    }

    if (isImportExportOnlyFile(fs.readFileSync(fullPath, 'utf8'))) {
      files.push(path.relative(rootDir, fullPath).replace(/\\/g, '/'));
    }
  }

  return files;
}

const importExportOnlyFiles = findImportExportOnlyFiles(srcDir);

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
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/artifacts/**',
    '!src/types/**',
    '!src/constants/**',
    '!src/**/constants/**',
    '!src/service/**',
    '!src/enums/**',
    '!src/index.ts',
    ...importExportOnlyFiles.map((file) => `!${file}`),
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'CommonJS',
          esModuleInterop: true,
          strict: true,
          sourceMap: true,
        },
      },
    ],
  },
};
