'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { fetchUserProfile } from '@/entities/auth/model/authSlice'
import { config } from '@/shared/config'
import { AppDispatch } from '@/app/store'

/**
 * AppBootstrap component - Handles app initialization tasks
 * - Rehydrates user data from server if token exists
 * - Should be rendered once at the root of the app
 */
export function AppBootstrap() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const token =
      typeof window !== 'undefined' &&
      localStorage.getItem(config.auth.tokenKey)
    console.log('AppBootstrap: Token found:', !!token)
    if (token) {
      console.log('AppBootstrap: Dispatching fetchUserProfile')
      dispatch(fetchUserProfile())
        .unwrap()
        .then((user) => {
          console.log('AppBootstrap: User profile loaded successfully:', user)
        })
        .catch((error) => {
          console.error('AppBootstrap: Failed to load user profile:', error)
        })
    }
  }, [dispatch])

  return null
}
