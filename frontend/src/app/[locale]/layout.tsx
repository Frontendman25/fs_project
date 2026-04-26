import type { Metadata } from 'next'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { Providers } from './providers'
import { locales } from '@/i18n/config'
import { SettingsMenu } from '@/shared/components/SettingsMenu'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: 'File Sharing Platform',
  description: 'Share your files securely and easily'
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages({ locale })
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SettingsMenu />
      {children}
    </NextIntlClientProvider>
  )
}
