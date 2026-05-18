export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'

/**
 * Main application configuration
 * Following Feature-Sliced Design - shared layer for cross-cutting concerns
 */
export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 10000
  },
  auth: {
    /** @deprecated Access token is kept in memory; refresh uses httpOnly cookie only. */
    tokenKey: 'accessToken'
  },
  files: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/*',
      'application/pdf',
      'text/*',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  }
} as const
