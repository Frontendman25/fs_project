'use client'

import { Provider } from 'react-redux'

import { store } from '@/app/store'

import { AppBootstrap } from '@/shared/components/AppBootstrap'
import { AuthProvider } from '@/widgets/auth/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/ui/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider
        enableSystem
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
      >
        <AuthProvider>
          <AppBootstrap />
          {children}
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </Provider>
  )
}
