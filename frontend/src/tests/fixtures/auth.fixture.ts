import type { TestPreloadedState } from '@/tests/utils/render'

export const authLoadingState: TestPreloadedState = {
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  }
}

export function authWithError(message: string): TestPreloadedState {
  return {
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: message
    }
  }
}
