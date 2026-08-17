import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Wrap } from '@/components/ui/Wrap'
import type { CaseStudy } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const TEKS_UI: Record<Locale, { eyebrow: string; judul: string; intro: string; status: string }> = {
  id: {
    eyebrow: 'Studi Kasus',
    judul: 'Test Case Terpilih',
    intro: 'Bukti kerja, bukan klaim.',
    status: 'PASS',
  },
  en: {
    eyebrow: 'Case Studies',
    judul: 'Selected Test Cases',
    intro: 'Proof of work, not claims.',
    status: 'PASS',
  },
}

export function CaseStudies({
  caseStudies,
  locale,
}: {
  caseStudies: CaseStudy[]
  locale: Locale
}) {
  if (caseStudies.length === 0) return null

  const ui = TEKS_UI[locale]

  return (
    <section id="studi-kasus" className="py-[88px]">
      <Wrap>
        <Eyebrow>{ui.eyebrow}</Eyebrow>
        <SectionHeading judul={ui.judul} intro={ui.intro} />

        <div className="grid gap-[22px] sm:grid-cols-2">
          {caseStudies.map((studi) => (
            <div
              key={studi.id}
              className="flex flex-col gap-3.5 rounded-xl border border-border bg-surface p-6"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs text-ink-faint">{studi.test_code}</span>
                <span className="rounded-full bg-pass-bg px-2.5 py-1 font-mono text-[11px] font-semibold text-pass">
                  {ui.status}
                </span>
              </div>

              <h3 className="text-lg font-display font-bold">
                {teks(studi.project_name, locale)}
              </h3>

              <p className="text-sm text-ink-soft">{teks(studi.objective, locale)}</p>

              {studi.tools_used.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {studi.tools_used.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-[5px] border border-border bg-bg px-2.5 py-1 font-mono text-[11px] text-ink-soft"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              ) : null}

              {studi.result_metrics.length > 0 ? (
                <div className="flex gap-5 border-t border-border pt-3">
                  {studi.result_metrics.map((metrik, i) => (
                    <div key={i}>
                      <b className="block font-display text-lg text-primary">{metrik.value}</b>
                      <span className="text-[11.5px] text-ink-faint">
                        {teks(metrik.label, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {studi.evidence_links.map((bukti, i) => (
                <a
                  key={i}
                  href={bukti.url}
                  className="text-[13.5px] font-semibold text-primary"
                >
                  {teks(bukti.label, locale)}
                </a>
              ))}
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  )
}
