import { Wrap } from '@/components/ui/Wrap'
import type { SiteSettings } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { LanguageSwitcher } from './LanguageSwitcher'

const LABEL_STATUS: Record<SiteSettings['availability_status'], Record<Locale, string>> = {
  available: { id: 'Tersedia', en: 'Available' },
  open: { id: 'Terbuka untuk Peluang', en: 'Open to Opportunities' },
  unavailable: { id: 'Tidak Tersedia', en: 'Not Available' },
}

const TAUTAN = [
  { anchor: 'tentang', label: { id: 'Tentang', en: 'About' } },
  { anchor: 'coverage', label: { id: 'Keahlian', en: 'Skills' } },
  { anchor: 'studi-kasus', label: { id: 'Studi Kasus', en: 'Case Studies' } },
  { anchor: 'automation-lab', label: { id: 'Automation Lab', en: 'Automation Lab' } },
  { anchor: 'pengalaman', label: { id: 'Pengalaman', en: 'Experience' } },
]

/**
 * `anchorTersedia` berisi anchor section yang BENAR-BENAR dirender halaman ini.
 *
 * Tanpa ini Nav menautkan kelima anchor tanpa syarat, sementara setiap section
 * menyembunyikan diri bila datanya kosong (kontrak lama di
 * `components/sections/`). Begitu studi kasus tak ada yang diterbitkan, tautan
 * "Studi Kasus" tetap tampil dan mengarah ke `#studi-kasus` yang tidak ada:
 * diklik, halaman tidak bergerak sama sekali. Persis kegagalan yang ditangkap
 * degradasi.spec.ts — dan test itu benar; yang salah navigasinya.
 *
 * Daftarnya dihitung pemanggil (KomposisiHalaman) dari data yang sama yang
 * dipakai merender section-nya, jadi keduanya tidak bisa menyimpang.
 */
export function Nav({
  settings,
  locale,
  anchorTersedia,
}: {
  settings: SiteSettings | null
  locale: Locale
  anchorTersedia: readonly string[]
}) {
  const tautan = TAUTAN.filter((t) => anchorTersedia.includes(t.anchor))

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      {/* Tanpa wordmark di kiri atas.
          "QA_portfolio" sebelumnya ditulis keras di sini — bukan dari database
          — dan menamai KATEGORI situsnya, bukan pemiliknya. Di halaman yang
          seluruh isinya sudah menyebut nama dan perannya, label itu tidak
          menambah keterangan apa pun.

          `justify-between` tetap dipakai: dengan tiga anak menjadi dua, tautan
          navigasi jatuh ke kiri dan kelompok status+bahasa tetap di kanan. */}
      <Wrap className="flex h-[72px] items-center justify-between">
        <nav className="hidden gap-7 text-sm text-ink-soft md:flex">
          {tautan.map((t) => (
            <a key={t.anchor} href={`#${t.anchor}`} className="hover:text-primary">
              {t.label[locale]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {settings ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-pass-bg px-3 py-1.5 font-mono text-xs text-pass sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-pass" aria-hidden />
              {LABEL_STATUS[settings.availability_status][locale]}
            </span>
          ) : null}
          <LanguageSwitcher aktif={locale} />
        </div>
      </Wrap>
    </header>
  )
}
