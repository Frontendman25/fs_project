import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    /** Load test env before any module (Prisma reads POSTGRESQL_URL at import time in some paths). */
    setupFiles: ['tests/setup/loadEnv.ts'],
    /** DB-backed suites share one DB; avoid parallel file races on truncate. */
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    hookTimeout: 60_000,
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/test.ts',
        'src/integration-example.ts',
        'src/**/*.d.ts'
      ]
    }
  }
})
