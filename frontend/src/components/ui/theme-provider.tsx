/**
 * @fileoverview Theme provider component for managing application-wide theme state
 * @module components/ui/theme-provider
 * @layer shared
 */

'use client'

import * as React from 'react'
import {
  type ThemeProviderProps,
  ThemeProvider as NextThemesProvider
} from 'next-themes'

/**
 * @component ThemeProvider
 * @description Context provider for theme management using next-themes.
 * Wraps the application to provide theme context and handle theme changes.
 * @example
 * ```tsx
 * <ThemeProvider
 *   attribute="class"
 *   defaultTheme="system"
 *   enableSystem
 * >
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
