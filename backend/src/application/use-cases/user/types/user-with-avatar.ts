import { User } from '@/domain/entities/user.entity'

/**
 * User with resolved avatar URL for API responses
 */
export interface UserWithAvatar extends User {
  avatarUrl?: string | null
}
