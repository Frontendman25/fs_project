/**
 * @fileoverview Settings menu component for managing application settings like theme and language
 * @module shared/components/SettingsMenu
 * @layer shared
 */

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Monitor, Moon, Sun } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { locales } from '@/i18n/config'
// import { locales } from '@/config'

/**
 * Props for the SettingsMenu component
 * @interface SettingsMenuProps
 */
interface SettingsMenuProps {
  /**
   * Optional CSS class name for styling
   * @type {string}
   */
  className?: string
}

type Theme = 'light' | 'dark' | 'system'

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor
} as const

/**
 * @component SettingsMenu
 * @description A dropdown menu component that provides options to change the application theme and language.
 * Uses shadcn/ui components and next-themes for theme management.
 * @example
 * ```tsx
 * <SettingsMenu className="my-2" />
 * ```
 */
export function SettingsMenu({ className }: SettingsMenuProps) {
  const t = useTranslations('common')
  const { theme = 'system', setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname() || ''

  const ThemeIcon = THEME_ICONS[theme as Theme]

  const handleLanguageChange = (locale: string) => {
    // Strip the current locale from pathname if it exists
    const newPathname = pathname.replace(/^\/[a-z]{2}/, '')
    router.push(`/${locale}${newPathname}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <ThemeIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Language options */}
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
          >
            {locale === 'en' ? 'English' : 'Polski'}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Theme options */}
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          {t('theme.light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          {t('theme.dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          {t('theme.system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
