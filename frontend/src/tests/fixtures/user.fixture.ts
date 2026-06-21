import type { TestPreloadedState } from '@/tests/utils/render'

/**
 * Current user is the single source of truth in the auth slice
 * (the separate user slice was removed during the RTK Query migration).
 */
export const authenticatedUserState: TestPreloadedState = {
  auth: {
    user: {
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      avatarUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    isAuthenticated: true,
    isLoading: false,
    error: null
  }
}

export const anonymousUserState: TestPreloadedState = {
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  }
}
