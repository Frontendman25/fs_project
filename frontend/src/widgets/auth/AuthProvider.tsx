'use client'

import React, { ReactNode, FC, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { AppDispatch } from '../../app/store'
import {
  bootstrapSession,
  clearAuth
} from '../../entities/auth/model/authSlice'
import { setSessionExpiredHandler } from '@/shared/lib/auth/access-token.store'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Restores session on load via httpOnly refresh cookie (silent refresh).
 */
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setSessionExpiredHandler(() => {
      dispatch(clearAuth())
    })
    return () => setSessionExpiredHandler(null)
  }, [dispatch])

  useEffect(() => {
    void dispatch(bootstrapSession()).finally(() => {
      setIsInitialized(true)
    })
  }, [dispatch])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}
