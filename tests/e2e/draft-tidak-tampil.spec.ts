import { expect, test, type APIRequestContext } from '@playwright/test'
import { headerAnon, urlTabel } from '../helpers/supabase-anon'
import { headerPemilik, tokenPemilik } from '../helpers/supabase-pemilik'

/**
 * Tidak satu pun baris berstatus 'draft' boleh tampil di halaman publik.
 *
 * PENANDANYA DIBACA DARI DATABASE, tidak lagi dituliskan sebagai daftar tetap.
 *
 * Versi sebelumnya memuat 12 penanda hasil salinan tangan dari seed.sql,
 * termasuk `'Appium'` dengan catatan "satu-satunya baris memakai nilai ini".
 * Catatan itu benar untuk seed, dan berhenti benar begitu pemiliknya mencatat
 * Appium sebagai keahliannya sendiri. Sejak itu test ini melaporkan kebocoran
 * yang tidak pernah terjadi — kata yang sama muncul di halaman karena memang
 * seharusnya muncul.
 *
 * Kanari yang nilainya bisa dipakai konten terbit akan selalu berbunyi palsu.
 * Karena itu setiap penanda di sini disaring dua kali: diambil dari baris
 * draft, LALU dibuang bila nilainya juga dipakai baris published. Yang tersisa
 * hanya nilai yang kemunculannya di halaman benar-benar berarti bocor.
 */
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

/** Kolom yang benar-benar dirender di halaman, per koleksi. */
const KOLOM_TERLIHAT: Record<string, string[]> = {
  tools: ['name'],
  skill_categories: ['category_name'],
  case_studies: ['test_code', 'project_name'],
  lab_scenarios: ['scenario_title'],
  experiences: ['company'],
  certifications: ['name'],
  education: ['institution'],
  testimonials: ['author_name'],
}

/** Ambil nilai teks dari kolom, baik teks biasa maupun dwibahasa {id, en}. */
function nilaiTeks(sel: unknown): string[] {
  if (typeof sel === 'string') return [sel]
  if (sel && typeof sel === 'object') {
    return Object.values(sel as Record<string, unknown>).filter(
      (v): v is string => typeof v === 'string',
    )
  }
  return []
}

async function baris(
  request: APIRequestContext,
  tabel: string,
  kolom: string[],
  header: Record<string, string>,
  status: 'draft' | 'published',
): Promise<string[]> {
  const res = await request.get(
    urlTabel(tabel, `?select=${kolom.join(',')}&status=eq.${status}`),
    { headers: header },
  )
  if (!res.ok()) throw new Error(`Gagal membaca ${tabel} (${status}): HTTP ${res.status()}`)
  const data = (await res.json()) as Array<Record<string, unknown>>
  return data.flatMap((b) => kolom.flatMap((k) => nilaiTeks(b[k])))
}

test.describe('Baris draft tidak pernah tampil publik', () => {
  test.beforeEach(() => {
    test.skip(
      !email || !password,
      'ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia — penanda draft hanya bisa dibaca sebagai pemilik.',
    )
  })

  for (const locale of ['id', 'en']) {
    test(`/${locale}: tidak satu pun nilai khas baris draft tampil`, async ({ page, request }) => {
      const token = await tokenPemilik(request, email!, password!)
      const pemilik = headerPemilik(token)

      const penanda: string[] = []
      for (const [tabel, kolom] of Object.entries(KOLOM_TERLIHAT)) {
        // Draft dibaca sebagai PEMILIK (anon memang tidak boleh melihatnya),
        // published dibaca sebagai ANON — tepat seperti yang dilihat pengunjung.
        const draft = await baris(request, tabel, kolom, pemilik, 'draft')
        const terbit = new Set(
          (await baris(request, tabel, kolom, headerAnon(), 'published')).map((v) =>
            v.trim().toLowerCase(),
          ),
        )

        for (const nilai of draft) {
          const bersih = nilai.trim()
          if (bersih.length < 4) continue // terlalu pendek untuk dicocokkan aman
          if (terbit.has(bersih.toLowerCase())) continue // dipakai juga oleh baris terbit
          penanda.push(bersih)
        }
      }

      test.skip(
        penanda.length === 0,
        'tidak ada baris draft dengan nilai khas — tidak ada yang bisa dibuktikan bocor',
      )

      await page.goto(`/${locale}`)

      // textContent, BUKAN innerText. innerText mengembalikan teks hasil render
      // yang sudah menerapkan text-transform CSS: judul kategori berkelas
      // uppercase, sehingga penanda 'Kategori Draft' tampil sebagai 'KATEGORI
      // DRAFT' dan pencocokan persis meleset. Dibuktikan dulu dengan
      // melumpuhkan filter status DI queries.ts DAN melonggarkan kebijakan RLS
      // anon: draft benar-benar terkirim ke halaman, dan versi lama test ini
      // tetap hijau.
      const isi = ((await page.locator('body').textContent()) ?? '').toLowerCase()
      const bocor = penanda.filter((p) => isi.includes(p.toLowerCase()))

      expect(
        bocor,
        bocor.length > 0
          ? `penanda draft bocor ke /${locale}: ${bocor.join(', ')}`
          : undefined,
      ).toEqual([])
    })
  }
})
