import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Wrap } from '@/components/ui/Wrap'
import type { SkillCategory } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'
import { SkillBars } from './SkillBars'

const TEKS_UI: Record<Locale, { eyebrow: string; judul: string; intro: string }> = {
  id: {
    eyebrow: 'Coverage',
    judul: 'Peta Keahlian',
    intro: 'Ditampilkan sebagai coverage — persis seperti membaca laporan test automation.',
  },
  en: {
    eyebrow: 'Coverage',
    judul: 'Skill Coverage Map',
    intro: 'Presented as coverage — just like reading a test automation report.',
  },
}

export function Coverage({
  skillCategories,
  locale,
}: {
  skillCategories: SkillCategory[]
  locale: Locale
}) {
  if (skillCategories.length === 0) return null

  const ui = TEKS_UI[locale]

  return (
    <section id="coverage" className="py-[88px]">
      <Wrap>
        <Eyebrow>{ui.eyebrow}</Eyebrow>
        <SectionHeading judul={ui.judul} intro={ui.intro} />

        <div className="grid gap-9 sm:grid-cols-2 sm:gap-12">
          {skillCategories.map((kategori) => (
            <div key={kategori.id}>
              <h3 className="mb-[18px] font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-faint">
                {teks(kategori.category_name, locale)}
              </h3>
              <SkillBars skills={kategori.skills} />
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  )
}
