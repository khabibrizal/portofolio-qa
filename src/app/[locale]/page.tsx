import { notFound } from 'next/navigation'
import { getPageContent } from '@/lib/content/get-page-content'
import { isLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

export const revalidate = 300

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const konten = await getPageContent()

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-24">
      <h1 className="font-display text-3xl font-bold">
        {teks(konten.hero?.role_title, locale)}
      </h1>
      <p className="mt-2 text-ink-soft">{teks(konten.hero?.short_intro, locale)}</p>
    </main>
  )
}
