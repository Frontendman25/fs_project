import { RootState } from '@/app/store'
import type { UserEntity, UserState } from './types'

/**
 * Root slice selector helper.
 * Adjust the path if your root reducer uses a different key.
 * @param state - Root Redux state
 */
const getSlice = (state: RootState): UserState => state.user as UserState

/**
 * Collection of user-related selectors.
 */
export const userSelectors = {
  /**
   * Select current user entity.
   * @param state - Root Redux state
   */
  selectUser: (state: RootState): UserEntity | null => getSlice(state)?.data ?? null,

  /**
   * Select current user's avatar URL.
   * @param state - Root Redux state
   */
  selectAvatarUrl: (state: RootState): string | null =>
    (getSlice(state)?.data?.avatarUrl as string | null | undefined) ?? null,

  /**
   * Select loading flag for user slice.
   * @param state - Root Redux state
   */
  selectUserLoading: (state: RootState): boolean => Boolean(getSlice(state)?.loading),

  /**
   * Select error message for user slice.
   * @param state - Root Redux state
   */
  selectUserError: (state: RootState): string | null =>
    (getSlice(state)?.error as string | null | undefined) ?? null
}