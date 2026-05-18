import axios from 'axios'

import { API_BASE_URL } from '@/shared/config'
import {
  getAccessToken,
  setAccessToken
} from '@/shared/lib/auth/access-token.store'
import { isAuthSessionInvalidError } from '@/shared/lib/auth/refresh-error'

import type { ApiResponse, AuthTokens } from '@/shared/types/api'

let refreshInFlight: Promise<string | null> | null = null

/**
 * POST /auth/refresh with httpOnly cookie (no Authorization header).
 * Deduplicates concurrent refresh calls.
 *
 * @returns new access token, or `null` if the refresh cookie/session is invalid.
 * @throws on transient failures (network, 5xx) — does not clear the stored token.
 */
export async function silentRefreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight
  }

  refreshInFlight = (async () => {
    try {
      const { data } = await axios.post<ApiResponse<AuthTokens>>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )

      const token =
        data.success && data.data?.accessToken ? data.data.accessToken : null

      if (!token) {
        setAccessToken(null)
        return null
      }

      setAccessToken(token)
      return token
    } catch (error) {
      if (isAuthSessionInvalidError(error)) {
        setAccessToken(null)
        return null
      }
      throw error
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

/** Returns current token or tries silent refresh once. */
export async function ensureAccessToken(): Promise<string | null> {
  const existing = getAccessToken()
  if (existing) {
    return existing
  }
  return silentRefreshAccessToken()
}
