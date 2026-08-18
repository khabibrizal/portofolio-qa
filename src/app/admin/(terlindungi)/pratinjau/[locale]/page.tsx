import { notFound } from 'next/navigation'
import { KomposisiHalaman } from '@/components/KomposisiHalaman'
import { getPageContentPratinjau, type PageContentPratinjau } from '@/lib/content/get-page-content'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

/**
 * Rute pratinjau (Task 7, keputusan D14): merender komposisi 12 section yang
 * SAMA dengan landing (`KomposisiHalaman`), tapi dengan data TANPA filter
 * status — draft ikut tampil, apa adanya.
 *
 * Berada di bawah `(terlindungi)` — layout grup ini sudah memeriksa sesi
 * (redirect ke `/admin/login` kalau tak ada user), dan middleware sudah
 * menjaga seluruh `/admin/:path*`. Halaman ini sendiri TIDAK menambah
 * pemeriksaan sesi baru; itu tanggung jawab layout, bukan diduplikasi
 * di sini.
 *
 * Rute ini dinamis (memakai cookie lewat `getPageContentPratinjau`), dan itu
 * TIDAK memengaruhi landing — landing memakai `getPageContent` (klien
 * anonim, tanpa cookie) lewat modul yang sama sekali berbeda, jadi build
 * tetap melaporkan `/id` dan `/en` sebagai `●` (lihat catatan D14 di
 * rencana fase, dan catatan pemisahan jalur di `get-page-content.ts`).
 *
 * Keputusan struktural #2: TIDAK ada flag `draft` yang dijalar ke dalam
 * `KomposisiHalaman`/section. Penanda draft sepenuhnya di LUAR komposisi:
 * spanduk pratinjau di atas, lalu panel ringkasan entri draft (dikelompokkan
 * per koleksi), baru komposisi penuh di bawahnya.
 */
export default async function HalamanPratinjau({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const konten = await getPageContentPratinjau()
  const kelompokDraft = kelompokkanDraft(konten, locale)
  const totalDraft = kelompokDraft.reduce((total, k) => total + k.entri.length, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <div id="spanduk-pratinjau" className="border-b-2 border-major bg-major/10 px-6 py-4">
        <p className="font-mono text-xs font-semibold tracking-wide text-major uppercase">
          Halaman Pratinjau — BUKAN halaman publik
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Yang tampil di bawah ini termasuk entri berstatus draft, supaya
          kamu bisa melihat halaman sebagaimana akan tampak setelah semuanya
          diterbitkan. Pengunjung publik di <code>/{locale}</code> tidak
          pernah melihat draft ini sampai kamu menerbitkannya lewat panel
          admin.
        </p>
      </div>

      <section id="ringkasan-draft" className="border-b border-border bg-surface px-6 py-6">
        <h2 className="text-lg font-semibold text-ink">
          Entri Draft {totalDraft > 0 ? `(${totalDraft})` : ''}
        </h2>

        {kelompokDraft.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">
            Tidak ada entri draft saat ini — semua yang tampil di bawah sudah terbit.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {kelompokDraft.map((kelompok) => (
              <div key={kelompok.label}>
                <h3 className="font-mono text-xs font-semibold tracking-wide text-ink-soft uppercase">
                  {kelompok.label} ({kelompok.entri.length})
                </h3>
                <ul className="mt-1 flex flex-col gap-0.5 pl-4 text-sm text-ink">
                  {kelompok.entri.map((judul, i) => (
                    <li key={i} className="list-disc">
                      {judul}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <KomposisiHalaman konten={konten} locale={locale} />
    </div>
  )
}

type KelompokDraft = { label: string; entri: string[] }

/**
 * Mengelompokkan entri berstatus draft per koleksi, untuk panel ringkasan.
 *
 * Hanya delapan koleksi yang punya konsep draft (`status_publikasi`) —
 * `site_settings`/`hero`/`about` singleton dan tidak masuk di sini (lihat
 * catatan yang sama di `queries-pratinjau.ts`). Judul tiap entri memakai
 * field yang PERSIS sama dengan yang dirender section-nya di
 * `KomposisiHalaman`, supaya panel dan komposisi di bawahnya konsisten
 * merujuk entri yang sama.
 */
function kelompokkanDraft(konten: PageContentPratinjau, locale: Locale): KelompokDraft[] {
  const kelompok: KelompokDraft[] = [
    {
      label: 'Tools',
      entri: konten.tools.filter((e) => e.status === 'draft').map((e) => e.name),
    },
    {
      label: 'Kategori Keahlian',
      entri: konten.skillCategories
        .filter((e) => e.status === 'draft')
        .map((e) => teks(e.category_name, locale) || '(tanpa nama)'),
    },
    {
      label: 'Studi Kasus',
      entri: konten.caseStudies
        .filter((e) => e.status === 'draft')
        .map((e) => `${e.test_code} — ${teks(e.project_name, locale) || '(tanpa nama)'}`),
    },
    {
      label: 'Skenario Automation Lab',
      entri: konten.labScenarios
        .filter((e) => e.status === 'draft')
        .map((e) => teks(e.scenario_title, locale) || '(tanpa judul)'),
    },
    {
      label: 'Pengalaman',
      entri: konten.experiences
        .filter((e) => e.status === 'draft')
        .map((e) => teks(e.company, locale) || '(tanpa nama)'),
    },
    {
      label: 'Sertifikasi',
      entri: konten.certifications.filter((e) => e.status === 'draft').map((e) => e.name),
    },
    {
      label: 'Pendidikan',
      entri: konten.education.filter((e) => e.status === 'draft').map((e) => e.institution),
    },
    {
      label: 'Testimoni',
      entri: konten.testimonials
        .filter((e) => e.status === 'draft')
        .map((e) => e.author_name),
    },
  ]

  return kelompok.filter((k) => k.entri.length > 0)
}
