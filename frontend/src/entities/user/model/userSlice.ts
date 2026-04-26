import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import type { UserEntity, UserState } from './types'

/**
 * Initial state for the user slice.
 */
const initialState: UserState = {
  data: null,
  loading: false,
  error: null
}

/**
 * User slice for handling current user data.
 * Provides action to update avatar URL after upload.
 */
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    /**
     * Set/replace the current user entity in store.
     * @param state - User slice state
     * @param action - Payload with user entity
     */
    setUser(state, action: PayloadAction<UserEntity | null>) {
      state.data = action.payload
      state.error = null
    },

    /**
     * Update the avatar URL of the current user.
     * @param state - User slice state
     * @param action - Payload with new avatar URL
     */
    updateAvatar(state, action: PayloadAction<string | null>) {
      if (state.data) {
        state.data.avatarUrl = action.payload
      } else {
        // If user is not set yet, initialize minimal user with avatar
        state.data = { id: '', username: '', avatarUrl: action.payload || null }
      }
    }
  }
})

export const { setUser, updateAvatar } = userSlice.actions

export const userReducer = userSlice.reducer