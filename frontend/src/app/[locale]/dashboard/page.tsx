'use client'

import { selectIsAuthenticated } from '@/entities/auth/model/authSelectors'
import { AuthPage } from '@/pages-ui/auth/AuthPage'
import { DashboardPage as Dashboard } from '@/pages-ui/dashboard/DashboardPage'
import { useAppSelector } from '@/shared/lib/hooks'

export default function DashboardPage() {
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
