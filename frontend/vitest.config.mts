import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror Next.js @/ alias so every component import resolves identically in tests.
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    // happy-dom is a fully-ESM DOM emulator; avoids the jsdom/html-encoding-sniffer
    // CommonJS ↔ ESM conflict that appears with Vitest 4 + Vite 7.
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/app/**',
        'src/tests/**',
        'src/providers/**',
        'src/widgets/**',
        'src/pages/**',
      ],
    },
  },
})
