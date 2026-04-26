'use client'

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

import { authApi } from '@/shared/api/auth'
import { userApi } from '@/shared/api/user'
import { User, LoginRequest, RegisterRequest } from '@/shared/types/api'
import { config } from '@/shared/config'
import { setUser as setUserEntity } from '@/entities/user/model/userSlice'

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
  async (credentials: LoginRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await authApi.login(credentials)

      if (response.success && response.data) {
        // Store tokens in localStorage
        localStorage.setItem(config.auth.tokenKey, response.data.accessToken)

        if (response.data.refreshToken) {
          localStorage.setItem(
            config.auth.refreshTokenKey,
            response.data.refreshToken
          )
        }

        // Mirror user data to user slice (convert User to UserEntity)
        const userEntity = {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          avatarUrl: response.data.user.avatarUrl
        }
        dispatch(setUserEntity(userEntity))

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
  async (userData: RegisterRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await authApi.register(userData)

      if (response.success && response.data) {
        // Mirror user data to user slice (convert User to UserEntity)
        const userEntity = {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          avatarUrl: response.data.user.avatarUrl
        }
        dispatch(setUserEntity(userEntity))
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

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // First get basic profile from auth endpoint
      const authResponse = await authApi.getProfile()
      if (!authResponse.success || !authResponse.data) {
        throw new Error(authResponse.message || 'Failed to fetch profile')
      }

      // Then get profile with avatar URL from user endpoint
      const userResponse = await userApi.getUserProfile(authResponse.data.id)
      if (userResponse.success && userResponse.data) {
        // Mirror user data with avatar to user slice (convert User to UserEntity)
        const userEntity = {
          id: userResponse.data.id,
          username: userResponse.data.username,
          email: userResponse.data.email,
          avatarUrl: userResponse.data.avatarUrl
        }
        dispatch(setUserEntity(userEntity))
        return userResponse.data
      }

      // Fallback to auth profile if user endpoint fails (convert User to UserEntity)
      const userEntity = {
        id: authResponse.data.id,
        username: authResponse.data.username,
        email: authResponse.data.email,
        avatarUrl: authResponse.data.avatarUrl
      }
      dispatch(setUserEntity(userEntity))
      return authResponse.data
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
      // Clear tokens from localStorage
      localStorage.removeItem(config.auth.tokenKey)
      localStorage.removeItem(config.auth.refreshTokenKey)

      // Clear user data from user slice
      dispatch(setUserEntity(null))

      return true
    } catch (error) {
      // Even if API call fails, clear local tokens
      localStorage.removeItem(config.auth.tokenKey)
      localStorage.removeItem(config.auth.refreshTokenKey)

      // Clear user data from user slice even on error
      dispatch(setUserEntity(null))

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
      if (response.success && response.data) {
        localStorage.setItem(config.auth.tokenKey, response.data.accessToken)
        if (response.data.refreshToken) {
          localStorage.setItem(
            config.auth.refreshTokenKey,
            response.data.refreshToken
          )
        }
        return response.data
      }
      throw new Error(response.message || 'Token refresh failed')
    } catch (error) {
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
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
    },
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
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

export const { clearError, setUser, clearAuth } = authSlice.actions
export const authReducer = authSlice.reducer
