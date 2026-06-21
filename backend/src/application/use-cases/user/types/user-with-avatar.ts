import { User } from '@/domain/entities/user.entity'
import { File } from '@/domain/entities/file.entity'

/** User with resolved avatar file entity. Client URLs are built in presentation. */
export interface UserWithAvatar extends User {
  avatarFile: File | null
}
