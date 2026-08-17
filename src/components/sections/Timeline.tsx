import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Wrap } from '@/components/ui/Wrap'
import type { Experience } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const TEKS_UI: Record<Locale, { eyebrow: string; judul: string }> = {
  id: { eyebrow: 'Execution Log', judul: 'Pengalaman Kerja' },
  en: { eyebrow: 'Execution Log', judul: 'Work Experience' },
}

// period_end kosong berarti masih berjalan. Label ini milik UI, bukan
// database, jadi dipilih lewat locale — bukan string kosong atau null.
const LABEL_SEKARANG: Record<Locale, string> = {
  id: 'Sekarang',
  en: 'Present',
}

function formatPeriode(tanggal: string, locale: Locale): string {
  return new Date(tanggal).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB', {
    year: 'numeric',
    month: 'long',
  })
}

export function Timeline({
  experiences,
  locale,
}: {
  experiences: Experience[]
  locale: Locale
}) {
  if (experiences.length === 0) return null

  const ui = TEKS_UI[locale]

  return (
    <section id="pengalaman" className="py-[88px]">
      <Wrap>
        <Eyebrow>{ui.eyebrow}</Eyebrow>
        <SectionHeading judul={ui.judul} />

        <div className="relative border-l-[1.5px] border-border pl-7">
          {experiences.map((pengalaman) => {
            const periodeAkhir = pengalaman.period_end
              ? formatPeriode(pengalaman.period_end, locale)
              : LABEL_SEKARANG[locale]

            return (
              <div key={pengalaman.id} className="relative pb-[38px] last:pb-0">
                <span
                  className="absolute -left-[34px] top-1 h-[11px] w-[11px] rounded-full border-2 border-primary bg-surface"
                  aria-hidden
                />
                <div className="mb-1 font-mono text-xs text-ink-faint">
                  {formatPeriode(pengalaman.period_start, locale)} — {periodeAkhir}
                </div>
                <div className="font-display text-[17px] font-bold">
                  {teks(pengalaman.role, locale)}
                </div>
                <div className="mb-2 text-sm font-semibold text-primary">
                  {teks(pengalaman.company, locale)}
                </div>

                {pengalaman.responsibilities.length > 0 || pengalaman.achievements.length > 0 ? (
                  <ul className="list-disc pl-[18px] text-[14.5px] text-ink-soft">
                    {pengalaman.responsibilities.map((tanggung, i) => (
                      <li key={`tanggung-${i}`}>{teks(tanggung.text, locale)}</li>
                    ))}
                    {pengalaman.achievements.map((capaian, i) => (
                      <li key={`capaian-${i}`}>{teks(capaian.text, locale)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
      </Wrap>
    </section>
  )
}
