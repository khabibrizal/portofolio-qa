import { urlMedia } from '@/lib/media'
import Image from 'next/image'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Wrap } from '@/components/ui/Wrap'
import type { Testimonial } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const TEKS_UI: Record<Locale, { eyebrow: string; judul: string }> = {
  id: { eyebrow: 'Assertions', judul: 'Kata Rekan Kerja' },
  en: { eyebrow: 'Assertions', judul: 'What Colleagues Say' },
}

function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? '')
    .join('')
}

export function Testimonials({
  testimonials,
  locale,
}: {
  testimonials: Testimonial[]
  locale: Locale
}) {
  if (testimonials.length === 0) return null

  const ui = TEKS_UI[locale]

  return (
    <section id="testimoni" className="py-[88px]">
      <Wrap>
        <Eyebrow>{ui.eyebrow}</Eyebrow>
        <SectionHeading judul={ui.judul} />

        <div className="grid gap-[22px] sm:grid-cols-2">
          {testimonials.map((testimoni) => (
            <div
              key={testimoni.id}
              className="rounded-xl border border-border bg-surface p-7"
            >
              <div className="mb-2.5 font-display text-[32px] leading-none text-pass">&ldquo;</div>
              <p className="mb-[18px] text-[15px] text-ink-soft">{teks(testimoni.quote, locale)}</p>
              <div className="flex items-center gap-3">
                {testimoni.photo ? (
                  <Image
                    src={urlMedia(testimoni.photo.path)!}
                    alt={teks(testimoni.photo.alt, locale)}
                    width={testimoni.photo.width}
                    height={testimoni.photo.height}
                    // Avatar selalu 38px di semua breakpoint — dinyatakan
                    // eksplisit supaya yang diunduh seukuran itu, bukan
                    // seukuran berkas aslinya.
                    sizes="38px"
                    className="h-[38px] w-[38px] rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-primary-tint font-mono text-xs font-semibold text-primary">
                    {inisial(testimoni.author_name)}
                  </span>
                )}
                <div>
                  <b className="block text-[13.5px]">{testimoni.author_name}</b>
                  <span className="text-xs text-ink-faint">
                    {teks(testimoni.author_role, locale)}
                    {testimoni.author_company ? ` · ${testimoni.author_company}` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  )
}
