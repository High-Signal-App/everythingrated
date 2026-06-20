import { defineVitestConfig } from '@saas-maker/test-config/vitest';

export default defineVitestConfig({
  include: ['apps/web/src/**/*.test.ts'],
  exclude: ['apps/web/.open-next/**', '.open-next/**'],
});
