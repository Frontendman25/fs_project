/**
 * @fileoverview Register form component
 * @description Registration form with validation for creating new user accounts
 * @layer features
 */

'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { TEST_IDS } from '@/shared/constants'
import { useAppDispatch, useAppSelector } from '../../../shared/lib/hooks'
import {
  selectIsLoading,
  selectError
} from '../../../entities/auth/model/authSelectors'
import { registerUser } from '../../../entities/auth/model/authSlice'
import { RegisterRequest } from '../../../shared/types/api'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type RegisterFormData = z.infer<ReturnType<typeof getRegisterSchema>>

const getRegisterSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      name: z.string().min(2, t('error.validation.name.min')),
      email: z.string().email(t('error.validation.email')),
      password: z
        .string()
        .min(6, t('error.validation.password.min', { length: 6 })),
      confirmPassword: z.string()
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('error.validation.password.match'),
      path: ['confirmPassword']
    })

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

/**
 * Registration form component for creating new user accounts
 * @param onSuccess - Callback function called on successful registration
 * @param onSwitchToLogin - Callback function to switch to login form
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)
  const t = useTranslations('auth.register')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(getRegisterSchema(t))
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...formData } = data
      void confirmPassword // Validated by Zod schema

      // Type-safe payload matching RegisterRequest interface
      const payload: RegisterRequest = {
        username: formData.name,
        password: formData.password,
        email: formData.email
      }

      await dispatch(registerUser(payload)).unwrap()

      toast.success(t('success.title'), {
        description: t('success.description')
      })

      onSuccess?.()
    } catch (error) {
      const description =
        typeof error === 'string'
          ? error
          : ((error as Error)?.message ?? t('error.description'))
      toast.error(t('error.title'), {
        description
      })
    }
  }

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
      <div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <UserPlus className="h-8 w-8 text-blue-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('title')}
          </h2>
        </div>
      </div>

      <form
        className="mt-8 space-y-6"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              {t('fields.name')}
            </label>
            <Input
              id="name"
              type="text"
              data-testid={TEST_IDS.registerForm.nameInput}
              required
              placeholder={t('fields.namePlaceholder')}
              {...register('name')}
              className="mt-1"
            />
            {errors.name && (
              <p role="alert" className="mt-1 text-sm text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t('fields.email')}
            </label>
            <Input
              id="email"
              type="email"
              data-testid={TEST_IDS.registerForm.emailInput}
              required
              placeholder={t('fields.emailPlaceholder')}
              {...register('email')}
              className="mt-1"
            />
            {errors.email && (
              <p role="alert" className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              {t('fields.password')}
            </label>
            <Input
              id="password"
              type="password"
              data-testid={TEST_IDS.registerForm.passwordInput}
              required
              placeholder={t('fields.passwordPlaceholder')}
              {...register('password')}
              className="mt-1"
            />
            {errors.password && (
              <p role="alert" className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              {t('fields.confirmPassword')}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              data-testid={TEST_IDS.registerForm.confirmPasswordInput}
              required
              placeholder={t('fields.confirmPasswordPlaceholder')}
              {...register('confirmPassword')}
              className="mt-1"
            />
            {errors.confirmPassword && (
              <p role="alert" className="mt-1 text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div
            data-testid={TEST_IDS.registerForm.authError}
            role="alert"
            className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md"
          >
            {error}
          </div>
        )}

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            data-testid={TEST_IDS.registerForm.submitButton}
          >
            {isLoading ? t('buttons.submitting') : t('buttons.submit')}
          </Button>
        </div>

        {onSwitchToLogin && (
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onSwitchToLogin}
              data-testid={TEST_IDS.registerForm.switchButton}
              className="text-sm text-blue-600 hover:text-blue-500 hover:underline cursor-pointer"
            >
              {t('buttons.switchToLogin')}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
