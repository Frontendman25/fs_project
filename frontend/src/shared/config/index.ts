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
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token'
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
