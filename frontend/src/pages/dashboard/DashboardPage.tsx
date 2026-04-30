/**
 * @fileoverview Dashboard page
 * @description Main dashboard page for authenticated users with logout functionality
 * @layer pages
 */

'use client'

import { useDispatch } from 'react-redux'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { useAppSelector } from '@/shared/lib/hooks'
import { userSelectors } from '@/entities/user/model/userSelectors'
import { Button } from '@/components/ui/button'
import { AppDispatch } from '@/app/store'
import { logoutUser } from '@/entities/auth/model/authSlice'
import { AvatarUploader } from '@/features/avatar'

/**
 * Dashboard page component for authenticated users
 */
export function DashboardPage() {
  const user = useAppSelector(userSelectors.selectUser)
  const dispatch = useDispatch<AppDispatch>()
  const t = useTranslations('dashboard')

  const handleLogout = () => {
    dispatch(logoutUser())
      .unwrap()
      .then(() => {
        toast.success(t('toast.logoutSuccess'))
      })
      .catch((err) => {
        toast.error(err)
      })
  }

  const handleSuccessToast = () => {
    toast.success(t('toast.saveSuccess'))
  }

  return (
    <main className="container mx-auto p-8">
      <section className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <AvatarUploader
          userId={user?.id || ''}
          avatarUrl={user?.avatarUrl}
          username={user?.username}
          size="lg"
        />
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('title', { name: user?.username || t('user') })}
          </h1>

          <Button onClick={handleLogout} variant="outline">
            {t('logout')}
          </Button>
        </header>

        <p className="text-gray-600 mb-4">{t('loggedInMessage')}</p>

        <Button onClick={handleSuccessToast}>{t('testSuccessToast')}</Button>
      </section>
    </main>
  )
}

export default DashboardPage
