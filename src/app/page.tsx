import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { pilihLocale } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic'

export default async function Root() {
  const daftarHeader = await headers()
  redirect(`/${pilihLocale(daftarHeader.get('accept-language'))}`)
}
