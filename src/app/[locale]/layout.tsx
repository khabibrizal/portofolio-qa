import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import { notFound } from 'next/navigation'
import { ambilSiteSettings } from '@/lib/content/queries'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'
import { KONTEN_MASIH_CONTOH, situsUrl } from '@/lib/seo'
import '../globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk', subsets: ['latin'],
  weight: ['500', '600', '700'], display: 'swap',
})
const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans', subsets: ['latin'],
  weight: ['400', '500', '600', '700'], display: 'swap',
})
/**
 * IBM Plex Mono adalah SATU-SATUNYA dari tiga keluarga di sini yang berkas
 * fontnya statis per bobot — Space Grotesk dan IBM Plex Sans keduanya font
 * variabel, satu berkas melayani seluruh rentang bobotnya, sehingga menambah
 * atau mengurangi bobot yang dideklarasikan tidak mengubah berat unduhan sama
 * sekali.
 *
 * Untuk mono, tiap bobot adalah berkas ~10 KB tersendiri. Bobot 500 hanya
 * dipakai dua kali (tombol di Automation Lab) dan sudah dinaikkan ke 600, jadi
 * mendeklarasikannya berarti mengunduh satu berkas penuh demi selisih tebal
 * yang tidak terlihat pada teks 13px.
 */
const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono', subsets: ['latin'],
  weight: ['400', '600'], display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  // Metadata tidak boleh menjatuhkan halaman kalau database bermasalah.
  const settings = await ambilSiteSettings().catch(() => null)


  return {
    // Tanpa metadataBase, canonical dan og:image tetap relatif dan ikut host
    // yang kebetulan diakses — termasuk *.vercel.app dan apex yang seharusnya
    // dialihkan. Mesin pencari dan pratayang tautan akan melihat alamat
    // berbeda-beda untuk halaman yang sama.
    metadataBase: new URL(situsUrl()),
    robots: KONTEN_MASIH_CONTOH ? { index: false, follow: false } : undefined,
    title: teks(settings?.site_title, locale) || 'Portofolio QA Engineer',
    description: teks(settings?.meta_description, locale) || undefined,
    alternates: {
      canonical: `/${locale}`,
      languages: { id: '/id', en: '/en' },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
