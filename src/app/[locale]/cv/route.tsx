import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import { DokumenCv, type DataCv } from '@/lib/cv/dokumen'
import {
  ambilAbout,
  ambilCertifications,
  ambilEducation,
  ambilExperiences,
  ambilHero,
  ambilSiteSettings,
  ambilSkillCategories,
} from '@/lib/content/queries'
import { isLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'
import { urlMedia } from '@/lib/media'

/**
 * CV dalam PDF, dibangun dari database saat diminta.
 *
 * Dinamis, bukan statis: CV harus mencerminkan isi database saat diunduh.
 * Menyajikan versi yang di-cache berarti seseorang bisa mengunduh CV yang
 * sudah tidak sesuai dengan halaman yang baru saja ia baca.
 */
export const dynamic = 'force-dynamic'

function namaBerkas(nama: string): string {
  const bersih = nama
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `CV-${bersih || 'Portofolio'}.pdf`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params
  if (!isLocale(locale)) {
    return new NextResponse('Bahasa tidak dikenal', { status: 404 })
  }

  const [settings, hero, about, skillCategories, experiences, certifications, education] =
    await Promise.all([
      ambilSiteSettings(),
      ambilHero(),
      ambilAbout(),
      ambilSkillCategories(),
      ambilExperiences(),
      ambilCertifications(),
      ambilEducation(),
    ])

  // Tanpa keduanya CV tidak punya identitas sama sekali — lebih jujur menolak
  // daripada mengirim PDF kosong yang terlihat seperti berkas rusak.
  if (!settings || !hero) {
    return new NextResponse('Data CV belum lengkap', { status: 503 })
  }

  const data: DataCv = {
    settings,
    hero,
    about,
    skillCategories,
    experiences,
    certifications,
    education,
    fotoUrl: urlMedia(about?.profile_photo?.path),
  }

  const pdf = await renderToBuffer(<DokumenCv data={data} locale={locale} />)

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      // `inline` supaya bisa dipratinjau di peramban, tapi dengan nama berkas
      // yang benar begitu pengguna menyimpannya.
      'Content-Disposition': `inline; filename="${namaBerkas(hero.full_name)}"`,
      'Cache-Control': 'no-store',
      'X-Judul-CV': encodeURIComponent(teks(hero.role_title, locale)),
    },
  })
}
