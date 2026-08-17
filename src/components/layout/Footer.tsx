import { Wrap } from '@/components/ui/Wrap'
import type { SiteSettings } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const LABEL_DIPERBARUI: Record<Locale, string> = {
  id: 'Terakhir diperbarui',
  en: 'Last updated',
}

export function Footer({ settings, locale }: { settings: SiteSettings | null; locale: Locale }) {
  if (!settings) return null

  const diperbarui = new Date(settings.updated_at).toLocaleDateString(
    locale === 'id' ? 'id-ID' : 'en-GB',
    { year: 'numeric', month: 'long' },
  )

  return (
    <footer className="border-t border-border py-9">
      <Wrap className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-faint">
        <span>
          {teks(settings.copyright_text, locale)} · {LABEL_DIPERBARUI[locale]} {diperbarui}
        </span>
        <div className="flex gap-4">
          {settings.linkedin_url ? (
            <a href={settings.linkedin_url} className="hover:text-primary">LinkedIn</a>
          ) : null}
          {settings.github_url ? (
            <a href={settings.github_url} className="hover:text-primary">GitHub</a>
          ) : null}
          <a href={`mailto:${settings.contact_email}`} className="hover:text-primary">Email</a>
        </div>
      </Wrap>
    </footer>
  )
}
