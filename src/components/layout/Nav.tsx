import { Wrap } from '@/components/ui/Wrap'
import type { SiteSettings } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { LanguageSwitcher } from './LanguageSwitcher'

const LABEL_STATUS: Record<SiteSettings['availability_status'], Record<Locale, string>> = {
  available: { id: 'Tersedia', en: 'Available' },
  open: { id: 'Terbuka untuk Peluang', en: 'Open to Opportunities' },
  unavailable: { id: 'Tidak Tersedia', en: 'Not Available' },
}

const TAUTAN = [
  { anchor: 'tentang', label: { id: 'Tentang', en: 'About' } },
  { anchor: 'coverage', label: { id: 'Keahlian', en: 'Skills' } },
  { anchor: 'studi-kasus', label: { id: 'Studi Kasus', en: 'Case Studies' } },
  { anchor: 'automation-lab', label: { id: 'Automation Lab', en: 'Automation Lab' } },
  { anchor: 'pengalaman', label: { id: 'Pengalaman', en: 'Experience' } },
]

export function Nav({ settings, locale }: { settings: SiteSettings | null; locale: Locale }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      <Wrap className="flex h-[72px] items-center justify-between">
        <span className="font-mono text-[15px] font-semibold">
          QA<span className="text-pass">_</span>portfolio
        </span>

        <nav className="hidden gap-7 text-sm text-ink-soft md:flex">
          {TAUTAN.map((t) => (
            <a key={t.anchor} href={`#${t.anchor}`} className="hover:text-primary">
              {t.label[locale]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {settings ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-pass-bg px-3 py-1.5 font-mono text-xs text-pass sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-pass" aria-hidden />
              {LABEL_STATUS[settings.availability_status][locale]}
            </span>
          ) : null}
          <LanguageSwitcher aktif={locale} />
        </div>
      </Wrap>
    </header>
  )
}
