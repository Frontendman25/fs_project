/**
 * Public backend base URL — shared across JWT issuer, file delivery, and any
 * client-facing absolute links back to this API.
 *
 * Domain-layer config: reads env lazily (after dotenv) but exposes a single,
 * correctly named entry point so callers do not depend on auth semantics.
 */

function firstNonEmptyTrimmed(
  values: readonly (string | undefined)[]
): string | undefined {
  for (const v of values) {
    const t = v?.trim()
    if (t) {
      return t
    }
  }
  return undefined
}

function stripTrailingSlash(url: string): string {
  const t = url.trim()
  if (t.length <= 1) {
    return t
  }
  return t.replace(/\/+$/, '')
}

/**
 * Resolves the public base URL of this backend (no trailing slash).
 *
 * Precedence: explicit deploy vars → `http://localhost:{PORT}` when unset
 * (set `BACKEND_URL` in production deploy).
 */
export function getBackendBaseUrl(): string {
  const fromEnv = firstNonEmptyTrimmed([
    process.env.BACKEND_URL,
    process.env.API_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.PUBLIC_URL
  ])
  if (fromEnv) {
    return stripTrailingSlash(fromEnv)
  }

  const port = process.env.PORT?.trim() || '3100'
  return stripTrailingSlash(`http://localhost:${port}`)
}

/** Normalizes a URL by trimming and removing trailing slashes. */
export function normalizeUrl(url: string): string {
  return stripTrailingSlash(url)
}
