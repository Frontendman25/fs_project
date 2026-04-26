import '@testing-library/jest-dom'
import { vi, afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'

import { server } from '@/tests/mocks/server'

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

// ─── next-intl ───────────────────────────────────────────────────────────────
// Returns translation keys for deterministic test output.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key
}))

// ─── sonner ──────────────────────────────────────────────────────────────────
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  },
  Toaster: () => null
}))

// ─── next/navigation ─────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}))

// ─── Browser APIs required by Radix UI ───────────────────────────────────────

// Radix UI Popper / Dialog internals check matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Radix UI Presence / Popover uses ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Some Radix UI primitives use IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}))
