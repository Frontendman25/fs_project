'use client'

import React, { ReactNode, FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { AppDispatch, RootState } from '../../app/store'
import { fetchUserProfile, setUser } from '../../entities/auth/model/authSlice'
import { config } from '../../shared/config'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Authentication Provider Component - Handles user authentication state
 * Wraps child components with user authentication context
 * @param children - Child components
 */
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      // Check if there's a token in localStorage
      const token = localStorage.getItem(config.auth.tokenKey)

      if (token) {
        try {
          // Try to fetch user profile with the existing token
          await dispatch(fetchUserProfile()).unwrap()
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem(config.auth.tokenKey)
          localStorage.removeItem(config.auth.refreshTokenKey)
        }
      }

      setIsInitialized(true)
    }

    initAuth()
  }, [dispatch])

  if (!isInitialized) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  return <>{children}</>
}
