'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { selectIsAuthenticated } from '@/entities/auth/model/authSelectors'
import { AuthPage } from '@/screens/auth/AuthPage'
import { DashboardPage } from '@/screens/dashboard/DashboardPage'
import { useAppSelector } from '@/shared/lib/hooks'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store'
import { config } from '@/shared/config'
import { fetchUserProfile } from '@/entities/auth/model/authSlice'

export default function Home() {
  // const t = useTranslations('Index')
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    const token =
      typeof window !== 'undefined' &&
      localStorage.getItem(config.auth.tokenKey)

    if (token) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch])

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <main className="min-h-screen">
      <DashboardPage />
    </main>
  )
}
