import { Wrap } from '@/components/ui/Wrap'
import type { Hero as HeroData } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const EYEBROW = 'QA Engineer Portfolio'

const JUDUL_UTAMA: Record<Locale, (namaLengkap: string) => string> = {
  id: (namaLengkap) => `${namaLengkap} memastikan produkmu lolos uji sebelum sampai ke user.`,
  en: (namaLengkap) => `${namaLengkap} makes sure your product passes QA before it reaches users.`,
}

const RINGKASAN_CEK: Record<Locale, (total: number) => string> = {
  id: (total) => `${total} pemeriksaan selesai`,
  en: (total) => `${total} checks completed`,
}

const LABEL_GAGAL: Record<Locale, (jumlah: number) => string> = {
  id: (jumlah) => `${jumlah} gagal`,
  en: (jumlah) => `${jumlah} failed`,
}

export function Hero({ hero, locale }: { hero: HeroData | null; locale: Locale }) {
  if (!hero) return null

  const jumlahGagal = hero.status_checks.filter((cek) => cek.status !== 'pass').length

  return (
    <section className="pt-20 pb-14">
      <Wrap className="grid items-center gap-14 sm:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-3.5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-primary">
            <span className="text-ink-faint">{'//'}</span>
            {EYEBROW}
          </div>

          <h1 className="mb-[18px] font-display text-[clamp(34px,4.6vw,52px)] leading-[1.08] font-bold tracking-[-0.01em]">
            {JUDUL_UTAMA[locale](hero.full_name)}
          </h1>

          <p className="mb-5 font-mono text-[15px] text-primary">
            {teks(hero.role_title, locale)}
          </p>

          <p className="mb-8 max-w-[460px] text-[16.5px] text-ink-soft">
            {teks(hero.short_intro, locale)}
          </p>

          <div className="mb-10 flex flex-wrap gap-3.5">
            <a
              href={hero.cta_primary.link}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-[14.5px] font-semibold text-white"
            >
              {teks(hero.cta_primary.label, locale)}
            </a>
            {hero.cta_secondary ? (
              <a
                href={hero.cta_secondary.link}
                className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-border bg-surface px-6 py-3.5 text-[14.5px] font-semibold text-ink"
              >
                {teks(hero.cta_secondary.label, locale)}
              </a>
            ) : null}
          </div>

          {hero.key_stats.length > 0 ? (
            <div className="grid grid-cols-2 gap-[18px] border-t border-border pt-[26px] sm:grid-cols-4">
              {hero.key_stats.map((stat, i) => (
                <div key={i}>
                  <b className="block font-display text-[22px]">{stat.value}</b>
                  <span className="text-[12.5px] text-ink-faint">{teks(stat.label, locale)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-[14px] bg-primary-dark shadow-[0_24px_60px_-20px_rgba(18,39,65,0.45)]">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-[18px] py-3.5">
            <span className="font-mono text-[12.5px] text-white/60">$ run_qa_profile --check-all</span>
          </div>

          <div className="px-5 pt-[22px] pb-[26px]">
            {hero.status_checks.map((cek, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-dashed border-white/10 py-2.5 font-mono text-[13.5px] text-white/90 last:border-b-0"
              >
                <span className="font-semibold text-pass">&#10003;</span>
                <b className="font-semibold">{teks(cek.label, locale)}</b>
                <span className="ml-auto text-white/40">
                  {cek.status.toUpperCase()} &middot; {cek.duration_label}
                </span>
              </div>
            ))}

            {hero.status_checks.length > 0 ? (
              <div className="mt-3.5 flex justify-between border-t border-white/10 pt-3.5 font-mono text-[12.5px] text-white/40">
                <span>{RINGKASAN_CEK[locale](hero.status_checks.length)}</span>
                <b className="text-pass">{LABEL_GAGAL[locale](jumlahGagal)}</b>
              </div>
            ) : null}
          </div>
        </div>
      </Wrap>
    </section>
  )
}
