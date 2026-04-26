'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDispatch, useSelector } from 'react-redux'
import { LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { TEST_IDS } from '@/shared/constants'

import { AppDispatch, RootState } from '@/app/store'
import { loginUser, clearError } from '@/entities/auth/model/authSlice'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

type LoginFormData = {
  username: string
  password: string
}

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

/**
 * Login form component for user authentication
 * @param onSuccess - Callback function called on successful login
 * @param onSwitchToRegister - Callback function to switch to register form
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)
  const t = useTranslations('auth.login')

  const loginSchema = z.object({
    username: z.string().min(1, t('validation.username.required')),
    password: z.string().min(1, t('validation.password.required'))
  })

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  React.useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await dispatch(loginUser(data))

      if (loginUser.fulfilled.match(result)) {
        toast.success(t('success.title'), {
          description: t('success.description')
        })
        onSuccess?.()
      }
    } catch (error) {
      toast.error(t('error.title'), {
        description: t('error.description')
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <LogIn className="h-6 w-6" />
          {t('title')}
        </CardTitle>
        <CardDescription className="text-center">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              {t('fields.usernameLabel')}
            </label>
            <Input
              id="username"
              type="text"
              data-testid={TEST_IDS.loginForm.usernameInput}
              placeholder={t('fields.usernamePlaceholder')}
              {...register('username')}
              className={errors.username ? 'border-red-500' : ''}
            />
            {errors.username && (
              <p role="alert" className="text-sm text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              {t('fields.passwordLabel')}
            </label>
            <Input
              id="password"
              type="password"
              data-testid={TEST_IDS.loginForm.passwordInput}
              placeholder={t('fields.passwordPlaceholder')}
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p role="alert" className="text-sm text-red-500">
                {t('validation.password.required')}
              </p>
            )}
          </div>

          {error && (
            <div
              data-testid={TEST_IDS.loginForm.authError}
              role="alert"
              className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md"
            >
              {error}
            </div>
          )}

          <Button
            variant="secondary"
            type="submit"
            className="w-full"
            data-testid={TEST_IDS.loginForm.submitButton}
            disabled={isLoading}
          >
            {isLoading ? t('buttons.submit') + '...' : t('buttons.submit')}
          </Button>

          {onSwitchToRegister && (
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={onSwitchToRegister}
                data-testid={TEST_IDS.loginForm.switchButton}
                className="text-sm text-blue-600 hover:text-blue-500 hover:underline cursor-pointer"
              >
                {t('buttons.switchToRegister')}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
