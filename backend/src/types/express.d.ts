import 'express'

import type { AuthenticatedUser } from '@/domain/entities/user.entity'

export type MinimalAuthenticatedUser = {
  id: string
  username: string
  email: string
  iat?: number
  exp?: number
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser
  }
}
