'use client'

import { Toaster } from 'sonner'
import { useTheme } from '@/providers/ThemeProvider'

export function ToastProvider() {
  const { theme } = useTheme()

  return (
    <Toaster
      position="top-right"
      theme={theme === 'system' ? undefined : theme}
      closeButton
      richColors
    />
  )
}
