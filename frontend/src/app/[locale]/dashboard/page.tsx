'use client'

import { useTranslations } from 'next-intl'
import { selectIsAuthenticated } from '@/entities/auth/model/authSelectors'
import { AuthPage } from '@/pages/auth/AuthPage'
import { DashboardPage as Dashboard } from '@/pages/dashboard/DashboardPage'
import { useAppSelector } from '@/shared/lib/hooks'

export default function DashboardPage() {
  // const t = useTranslations('Index')
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <main className="min-h-screen">
      <Dashboard />
    </main>
  )
}
