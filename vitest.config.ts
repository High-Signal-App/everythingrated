// Plain Vitest config (formerly @saas-maker/test-config/vitest, inlined).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    include: ['apps/web/src/**/*.test.ts'],
    exclude: ['apps/web/.open-next/**', '.open-next/**', '**/node_modules/**'],
  },
});
