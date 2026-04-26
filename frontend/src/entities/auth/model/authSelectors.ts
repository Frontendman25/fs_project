/**
 * @fileoverview Auth entity selectors
 * @description Selectors for accessing auth state from Redux store
 * @layer entities
 */

import { RootState } from '@/app/store'

/**
 * Select entire auth state
 */
export const selectAuth = (state: RootState) => state.auth

/**
 * Select current user data
 */
export const selectUser = (state: RootState) => state.auth.user

/**
 * Select authentication status
 */
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated

/**
 * Select loading state for auth operations
 */
export const selectIsLoading = (state: RootState) => state.auth.isLoading

/**
 * Select auth error message
 */
export const selectError = (state: RootState) => state.auth.error
