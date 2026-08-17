import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/Footer'
import { Nav } from '@/components/layout/Nav'
import { Hero } from '@/components/sections/Hero'
import { TrustStrip } from '@/components/sections/TrustStrip'
import { getPageContent } from '@/lib/content/get-page-content'
import { isLocale } from '@/lib/i18n/locales'

export const revalidate = 300

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const konten = await getPageContent()

  return (
    <>
      <Nav settings={konten.siteSettings} locale={locale} />
      <main className="flex-1">
        <Hero hero={konten.hero} locale={locale} />
        <TrustStrip tools={konten.tools} locale={locale} />
      </main>
      <Footer settings={konten.siteSettings} locale={locale} />
    </>
  )
}
