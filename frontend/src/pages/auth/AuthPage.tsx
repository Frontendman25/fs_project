/**
 * @fileoverview Authentication page component that handles user login and registration
 * @module pages/auth/AuthPage
 * @layer pages
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { RegisterForm } from '@/features/auth/ui/RegisterForm'
import { LoginForm } from '@/features/auth/ui/LoginForm'

/**
 * @component AuthPage
 * @description Main authentication page that toggles between login and registration forms.
 * Handles form switching and success notifications.
 *
 * @example
 * ```tsx
 * // In app/auth/page.tsx
 * export default function AuthRoute() {
 *   return <AuthPage />
 * }
 * ```
 */
export function AuthPage() {
  const router = useRouter()

  const [isRegisterMode, setIsRegisterMode] = useState(false)

  /**
   * Handles successful registration by switching to login mode
   * and showing a success notification
   */
  const handleRegisterSuccess = () => {
    setIsRegisterMode(false)

    // router.replace('/dashboard')

    // // Redirect to dashboard page on successful registration via next.js
    // setTimeout(() => {
    //   router.push('/dashboard')
    // }, 1000)

    toast.success('Account created! Please sign in.')
  }

  /**
   * Handles successful login and redirects to dashboard
   */
  const handleLoginSuccess = () => {
    toast.success('Login successful!')
    // Redirect to dashboard with locale
    router.push('/en/dashboard')
  }

  if (isRegisterMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setIsRegisterMode(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setIsRegisterMode(true)}
      />
    </div>
  )
}
