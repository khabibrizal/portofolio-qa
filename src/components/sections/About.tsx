import { urlMedia } from '@/lib/media'
import Image from 'next/image'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Wrap } from '@/components/ui/Wrap'
import type { About as AboutData } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const TEKS_UI: Record<Locale, { eyebrow: string; placeholderFoto: string }> = {
  id: { eyebrow: 'Tentang Saya', placeholderFoto: 'Foto Profil' },
  en: { eyebrow: 'About Me', placeholderFoto: 'Profile Photo' },
}

export function About({ about, locale }: { about: AboutData | null; locale: Locale }) {
  if (!about) return null

  const ui = TEKS_UI[locale]
  const richtext = teks(about.about_richtext, locale)
  const punyaBadge = about.highlight_badges.length > 0

  return (
    <section id="tentang" className="py-[88px]">
      <Wrap className="grid items-start gap-14 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-border bg-linear-to-br from-primary-tint to-border font-mono text-[13px] text-ink-faint">
          {about.profile_photo ? (
            <Image
              src={urlMedia(about.profile_photo.path)!}
              alt={teks(about.profile_photo.alt, locale)}
              width={about.profile_photo.width}
              height={about.profile_photo.height}
              // Kolom foto adalah 0.8fr dari grid [0.8fr_1.2fr] di layar >=640px,
              // jadi sekitar 40vw; di bawah itu ia selebar kontainer. Tanpa
              // `sizes`, next/image mengasumsikan 100vw dan mengunduh berkas
              // jauh lebih besar daripada yang pernah ditampilkan.
              sizes="(min-width: 640px) 40vw, 100vw"
              className="h-full w-full object-cover"
            />
          ) : (
            ui.placeholderFoto
          )}
        </div>

        <div>
          <Eyebrow>{ui.eyebrow}</Eyebrow>
          {richtext ? <p className="mb-4 text-[15.5px] text-ink-soft">{richtext}</p> : null}
          {punyaBadge ? (
            <div className="mt-[22px] flex flex-wrap gap-2.5">
              {about.highlight_badges.map((badge, i) => (
                <span
                  key={i}
                  className="rounded-md border border-primary/10 bg-primary-tint px-3 py-1.5 font-mono text-xs text-primary"
                >
                  {teks(badge.text, locale)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Wrap>
    </section>
  )
}
