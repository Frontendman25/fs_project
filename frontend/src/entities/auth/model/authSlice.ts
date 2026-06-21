'use client'

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

import { authApi } from '@/shared/api/auth'
import { baseApi } from '@/shared/api/base-api'
import { User, LoginRequest, RegisterRequest } from '@/shared/types/api'
import {
  clearAccessToken,
  setAccessToken
} from '@/shared/lib/auth/access-token.store'
import { isAuthSessionInvalidError } from '@/shared/lib/auth/refresh-error'
import { silentRefreshAccessToken } from '@/shared/lib/auth/silent-refresh'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials)

      if (response.success && response.data) {
        setAccessToken(response.data.accessToken)
        return response.data.user
      }

      throw new Error(response.message || 'Login failed')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed'
      )
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData)

      if (response.success && response.data) {
        return response.data.user
      }

      throw new Error(response.message || 'Registration failed')
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registration failed'
      )
    }
  }
)

/** F5 / app start: refresh cookie → access token → profile. */
export const bootstrapSession = createAsyncThunk(
  'auth/bootstrap',
  async (_, { dispatch }) => {
    try {
      const token = await silentRefreshAccessToken()
      if (!token) {
        return null
      }

      return await dispatch(fetchUserProfile()).unwrap()
    } catch (error) {
      if (isAuthSessionInvalidError(error)) {
        clearAccessToken()
      }
      return null
    }
  }
)

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile()
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch profile')
      }

      return response.data
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch profile'
      )
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await authApi.logout()
      clearAccessToken()

      // Drop all cached server-state so a different user never sees stale data.
      dispatch(baseApi.util.resetApiState())

      return true
    } catch (error) {
      clearAccessToken()
      dispatch(baseApi.util.resetApiState())

      return rejectWithValue(
        error instanceof Error ? error.message : 'Logout failed'
      )
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.refreshToken()
      if (response.success && response.data?.accessToken) {
        setAccessToken(response.data.accessToken)
        return response.data
      }
      throw new Error(response.message || 'Token refresh failed')
    } catch (error) {
      if (isAuthSessionInvalidError(error)) {
        clearAccessToken()
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token refresh failed'
      )
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearAuth: (state) => {
      clearAccessToken()
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
    setAvatarUrl: (state, action: PayloadAction<string | null>) => {
      if (state.user) {
        state.user = { ...state.user, avatarUrl: action.payload }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = false // User needs to login after registration
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Bootstrap session (silent refresh on load)
      .addCase(bootstrapSession.pending, (state) => {
        state.isLoading = true
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
        if (action.payload) {
          state.user = action.payload
          state.isAuthenticated = true
        } else {
          state.user = null
          state.isAuthenticated = false
        }
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
      })
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout request fails, clear local auth state
        state.user = null
        state.isAuthenticated = false
        state.error = null
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, () => {
        // Token refreshed successfully, maintain current state
      })
      .addCase(refreshToken.rejected, (state) => {
        // Token refresh failed, clear auth state
        state.user = null
        state.isAuthenticated = false
      })
  }
})

export const { clearError, clearAuth, setAvatarUrl } = authSlice.actions
export const authReducer = authSlice.reducer
