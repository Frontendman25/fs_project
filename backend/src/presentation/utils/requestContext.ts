import { Request } from 'express'

/**
 * Extract device context from Express request for session tracking
 * Used for refresh token device tracking and active sessions view
 */
export function extractDeviceContext(req: Request): {
  deviceInfo: string
  ipAddress: string
} {
  const userAgent = req.headers['user-agent'] ?? 'Unknown'
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'Unknown'

  return {
    deviceInfo: userAgent,
    ipAddress: ip
  }
}

/**
 * Express params can be string or string[] depending on parser/middleware.
 * Normalize to the first string value to keep controller boundaries strict.
 */
export function normalizeParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value
}
