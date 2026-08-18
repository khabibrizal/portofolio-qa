import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import { notFound } from 'next/navigation'
import { ambilSiteSettings } from '@/lib/content/queries'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'
import '../globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk', subsets: ['latin'],
  weight: ['500', '600', '700'], display: 'swap',
})
const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans', subsets: ['latin'],
  weight: ['400', '500', '600', '700'], display: 'swap',
})
const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono', subsets: ['latin'],
  weight: ['400', '500', '600'], display: 'swap',
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

  // Situs tayang publik sementara isinya masih data contoh: nama, angka
  // pengalaman, studi kasus, dan testimoni semuanya placeholder. Membiarkan
  // mesin pencari mengindeksnya berarti klaim palsu beredar atas nama
  // pemiliknya — persis kebalikan dari tujuan portofolio ini.
  //
  // noindex berlaku sampai konten asli masuk. Dilepas di Fase 5; dicatat
  // sebagai U-5 di UTANG-TERBUKA.md agar tidak terlupakan.
  const KONTEN_MASIH_CONTOH = true

  return {
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
