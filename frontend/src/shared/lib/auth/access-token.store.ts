/**
 * In-memory access token (not localStorage — reduces XSS exposure).
 * Survives F5 via silent refresh using the httpOnly refresh cookie.
 */
let accessToken: string | null = null

let onSessionExpired: (() => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function clearAccessToken(): void {
  accessToken = null
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler
}

export function notifySessionExpired(): void {
  clearAccessToken()
  onSessionExpired?.()
}
