import axios from 'axios'

/**
 * Refresh failed because the session/cookie is invalid — safe to clear auth.
 * Network blips and 5xx must NOT clear the in-memory access token.
 */
export function isAuthSessionInvalidError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false
  }

  if (!error.response) {
    return false
  }

  const status = error.response.status
  return status === 401 || status === 403
}
