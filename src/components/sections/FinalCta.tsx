import { Wrap } from '@/components/ui/Wrap'
import type { SiteSettings } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const TEKS_UI: Record<
  Locale,
  { kirimEmail: string; chatWhatsapp: string; lihatLinkedin: string; lihatGithub: string }
> = {
  id: {
    kirimEmail: 'Kirim Email',
    chatWhatsapp: 'Chat WhatsApp',
    lihatLinkedin: 'Lihat LinkedIn',
    lihatGithub: 'Lihat GitHub',
  },
  en: {
    kirimEmail: 'Send Email',
    chatWhatsapp: 'Chat on WhatsApp',
    lihatLinkedin: 'View LinkedIn',
    lihatGithub: 'View GitHub',
  },
}

// Nomor di database berbentuk "+628000000000". wa.me menolak "+", spasi,
// dan tanda hubung — semuanya harus dibuang sebelum jadi tautan.
function tautanWhatsapp(nomor: string): string {
  return `https://wa.me/${nomor.replace(/[+\s-]/g, '')}`
}

export function FinalCta({
  settings,
  locale,
}: {
  settings: SiteSettings | null
  locale: Locale
}) {
  if (!settings) return null

  const ui = TEKS_UI[locale]

  return (
    <section id="kontak" className="py-[88px]">
      <Wrap>
        <div className="relative overflow-hidden rounded-[20px] bg-primary px-6 py-16 text-center sm:px-12">
          <h2 className="mb-3 font-display text-[clamp(26px,3.4vw,36px)] font-bold tracking-[-0.01em] text-white">
            {teks(settings.final_cta_headline, locale)}
          </h2>
          <p className="mx-auto mb-[30px] max-w-[460px] text-[15.5px] text-white/70">
            {teks(settings.final_cta_subtext, locale)}
          </p>

          <div className="flex flex-wrap justify-center gap-3.5">
            <a
              href={`mailto:${settings.contact_email}`}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-[14.5px] font-semibold text-primary"
            >
              {ui.kirimEmail}
            </a>

            {settings.whatsapp_number ? (
              <a
                href={tautanWhatsapp(settings.whatsapp_number)}
                className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-white/35 px-6 py-3.5 text-[14.5px] font-semibold text-white"
              >
                {ui.chatWhatsapp}
              </a>
            ) : null}

            {settings.linkedin_url ? (
              <a
                href={settings.linkedin_url}
                className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-white/35 px-6 py-3.5 text-[14.5px] font-semibold text-white"
              >
                {ui.lihatLinkedin}
              </a>
            ) : null}

            {settings.github_url ? (
              <a
                href={settings.github_url}
                className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-white/35 px-6 py-3.5 text-[14.5px] font-semibold text-white"
              >
                {ui.lihatGithub}
              </a>
            ) : null}
          </div>
        </div>
      </Wrap>
    </section>
  )
}
