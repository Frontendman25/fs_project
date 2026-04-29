export const locales = ['en', 'pl'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale = 'en'

export type LocalePrefix = 'always' | 'as-needed' | 'never'
