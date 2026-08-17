'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n/locales'

export function LanguageSwitcher({ aktif }: { aktif: Locale }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={pathname.replace(/^\/(id|en)/, `/${locale}`)}
          hrefLang={locale}
          aria-current={locale === aktif ? 'true' : undefined}
          className={
            locale === aktif
              ? 'rounded px-2 py-1 text-primary underline underline-offset-4'
              : 'rounded px-2 py-1 text-ink-faint hover:text-primary'
          }
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
