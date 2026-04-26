import type { TestPreloadedState } from '@/tests/utils/render'

export const authenticatedUserState: TestPreloadedState = {
  user: {
    data: {
      id: 'u1',
      username: 'alice',
      email: 'alice@example.com',
      avatarUrl: null
    },
    loading: false,
    error: null
  }
}

export const anonymousUserState: TestPreloadedState = {
  user: {
    data: null,
    loading: false,
    error: null
  }
}
