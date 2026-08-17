import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Wrap } from '@/components/ui/Wrap'
import type { Certification, Education } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const TEKS_UI: Record<Locale, { eyebrow: string; judul: string }> = {
  id: { eyebrow: 'Sertifikasi', judul: 'Sertifikasi & Edukasi' },
  en: { eyebrow: 'Certifications', judul: 'Certifications & Education' },
}

const KARTU_CLASS = 'rounded-[10px] border border-border bg-surface p-5'

export function Certifications({
  certifications,
  education,
  locale,
}: {
  certifications: Certification[]
  education: Education[]
  locale: Locale
}) {
  if (certifications.length === 0 && education.length === 0) return null

  const ui = TEKS_UI[locale]

  return (
    <section id="sertifikasi" className="py-[88px]">
      <Wrap>
        <Eyebrow>{ui.eyebrow}</Eyebrow>
        <SectionHeading judul={ui.judul} />

        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((sertifikat) =>
            sertifikat.credential_url ? (
              <a key={sertifikat.id} href={sertifikat.credential_url} className={KARTU_CLASS}>
                <h4 className="mb-1 text-[15px] font-semibold">{sertifikat.name}</h4>
                <p className="text-[13px] text-ink-faint">
                  {sertifikat.issuer} · {sertifikat.year}
                </p>
              </a>
            ) : (
              <div key={sertifikat.id} className={KARTU_CLASS}>
                <h4 className="mb-1 text-[15px] font-semibold">{sertifikat.name}</h4>
                <p className="text-[13px] text-ink-faint">
                  {sertifikat.issuer} · {sertifikat.year}
                </p>
              </div>
            ),
          )}

          {education.map((edukasi) => (
            <div key={edukasi.id} className={KARTU_CLASS}>
              <h4 className="mb-1 text-[15px] font-semibold">{teks(edukasi.degree, locale)}</h4>
              <p className="text-[13px] text-ink-faint">
                {edukasi.institution} · {edukasi.year}
              </p>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  )
}
