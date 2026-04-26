'use client'

import { PropsWithChildren } from 'react'
import { NextIntlClientProvider } from 'next-intl'

/**
 * @component IntlProvider
 * @description Client-side internationalization provider using next-intl
 */
interface IntlProviderProps extends PropsWithChildren {
  messages: Record<string, any>
  locale: string
}

export function IntlProvider({ children, messages, locale }: IntlProviderProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  )
}
