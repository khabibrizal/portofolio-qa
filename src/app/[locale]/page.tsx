import { notFound } from 'next/navigation'
import { KomposisiHalaman } from '@/components/KomposisiHalaman'
import { getPageContent } from '@/lib/content/get-page-content'
import { isLocale } from '@/lib/i18n/locales'

export const revalidate = 300

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const konten = await getPageContent()

  return <KomposisiHalaman konten={konten} locale={locale} />
}
