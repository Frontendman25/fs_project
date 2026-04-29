/**
 * Shape of the User entity stored in Redux.
 */
export interface UserEntity {
  id: string
  username: string
  email?: string
  avatarUrl?: string | null
}

/**
 * User slice state.
 */
export interface UserState {
  data: UserEntity | null
  loading: boolean
  error?: string | null
}
