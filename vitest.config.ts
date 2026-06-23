// Plain Vitest config (formerly @saas-maker/test-config/vitest, inlined).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    include: ['apps/web/src/**/*.test.ts'],
    exclude: ['apps/web/.open-next/**', '.open-next/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['apps/web/src/lib/**/*.ts', 'packages/db/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/index.ts', 'node_modules', 'dist', '.next', '.wrangler'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
