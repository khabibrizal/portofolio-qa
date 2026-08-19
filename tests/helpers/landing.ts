import { expect, test, type Page } from '@playwright/test'
import { about, hero, koleksi, settings, type Dwibahasa } from './konten'
import type { Locale } from '../../src/lib/i18n/locales'

/**
 * Suite "halaman menampilkan isi database" untuk satu bahasa.
 *
 * Dipakai bersama oleh landing-id.spec.ts dan landing-en.spec.ts supaya
 * keduanya tidak menyalin blok yang sama dua kali lalu menyimpang.
 *
 * SEMUA nilai yang diharapkan dibaca dari database lewat REST anonim — lihat
 * alasan panjangnya di `konten.ts`. Ringkasnya: mengunci teks seed di dalam
 * asersi membuat suite ini menandai "konten berubah" sebagai kegagalan,
 * padahal mengubah konten justru satu-satunya tujuan panel admin.
 *
 * Koleksi yang KOSONG dilewati dengan pesan, bukan digagalkan. Portofolio yang
 * belum punya sertifikasi bukan portofolio yang rusak, dan test tidak boleh
 * menuntut pemiliknya mengarang sertifikat supaya suite-nya hijau.
 */


/**
 * textContent, BUKAN innerText, dan dibandingkan huruf kecil semua.
 *
 * innerText mengembalikan teks HASIL RENDER — sudah menerapkan text-transform
 * CSS. Judul kategori di section Coverage berkelas uppercase, jadi nilai
 * database "QA & Testing" muncul di layar sebagai "QA & TESTING" dan
 * pencocokan persis meleset. Pelajaran ini sudah pernah dibayar mahal di
 * draft-tidak-tampil.spec.ts: versi lamanya hijau padahal draft benar-benar
 * bocor.
 */
async function isiHalaman(page: Page): Promise<string> {
  return ((await page.locator('body').textContent()) ?? '').toLowerCase()
}

function harusMemuat(isi: string, nilai: string | null | undefined, konteks: string) {
  if (!nilai) return
  const dipangkas = nilai.trim()
  if (dipangkas.length === 0) return
  // Teks panjang dipotong: paragraf bisa dirender terpecah oleh markup, dan
  // yang ingin dibuktikan adalah nilainya berasal dari database — bukan bahwa
  // seluruh 700 karakternya utuh dalam satu simpul teks.
  const dicari = dipangkas.slice(0, 60).toLowerCase()
  expect(isi, `${konteks}: "${dicari}" tidak ada di halaman`).toContain(dicari)
}

export function suiteKontenLanding(locale: Locale) {
  test.describe(`/${locale} — halaman menampilkan isi database`, () => {
    test('Hero: peran, perkenalan, statistik, dan konsol status', async ({ page, request }) => {
      const h = await hero(request)
      await page.goto(`/${locale}`)
      const isi = await isiHalaman(page)

      harusMemuat(isi, h.full_name, 'hero.full_name')
      harusMemuat(isi, h.role_title[locale], 'hero.role_title')
      harusMemuat(isi, h.short_intro[locale], 'hero.short_intro')

      for (const s of h.key_stats) {
        harusMemuat(isi, s.value, 'key_stats.value')
        harusMemuat(isi, s.label[locale], 'key_stats.label')
      }
      for (const c of h.status_checks) {
        harusMemuat(isi, c.label[locale], 'status_checks.label')
      }
    })

    test('TrustStrip: setiap tool published tampil', async ({ page, request }) => {
      const tools = await koleksi<{ name: string }>(request, 'tools', 'name,sort_order')
      test.skip(tools.length === 0, 'belum ada tool published')

      await page.goto(`/${locale}`)
      const isi = await isiHalaman(page)
      for (const t of tools) harusMemuat(isi, t.name, 'tools.name')
    })

    test('About: teks tentang dan badge highlight', async ({ page, request }) => {
      const a = await about(request)
      test.skip(a === null, 'singleton about belum ada')

      await page.goto(`/${locale}`)
      const isi = await isiHalaman(page)

      harusMemuat(isi, a!.about_richtext[locale], 'about.about_richtext')
      for (const b of a!.highlight_badges) harusMemuat(isi, b.text[locale], 'highlight_badges')
    })

    test('Coverage: setiap kategori keahlian dan skill di dalamnya', async ({ page, request }) => {
      const kategori = await koleksi<{
        category_name: Dwibahasa
        skills: Array<{ name: string }>
      }>(request, 'skill_categories', 'category_name,skills,sort_order')
      test.skip(kategori.length === 0, 'belum ada kategori keahlian published')

      await page.goto(`/${locale}`)
      const isi = await isiHalaman(page)

      for (const k of kategori) {
        harusMemuat(isi, k.category_name[locale], 'skill_categories.category_name')
        for (const s of k.skills) harusMemuat(isi, s.name, 'skills.name')
      }
    })

    test('CaseStudies: kode test dan nama proyek', async ({ page, request }) => {
      const studi = await koleksi<{ test_code: string; project_name: Dwibahasa }>(
        request, 'case_studies', 'test_code,project_name,sort_order',
      )
      test.skip(studi.length === 0, 'belum ada studi kasus published')

      await page.goto(`/${locale}`)
      const isi = ((await page.locator('#studi-kasus').textContent()) ?? '').toLowerCase()

      for (const s of studi) {
        harusMemuat(isi, s.test_code, 'case_studies.test_code')
        harusMemuat(isi, s.project_name[locale], 'case_studies.project_name')
      }
    })

    test('AutomationLab: framework dan judul skenario', async ({ page, request }) => {
      const lab = await koleksi<{ framework_name: string; scenario_title: Dwibahasa }>(
        request, 'lab_scenarios', 'framework_name,scenario_title,sort_order',
      )
      test.skip(lab.length === 0, 'belum ada skenario lab published')

      await page.goto(`/${locale}`)
      const isi = ((await page.locator('#automation-lab').textContent()) ?? '').toLowerCase()

      for (const l of lab) {
        harusMemuat(isi, l.framework_name, 'lab_scenarios.framework_name')
      }
      // Hanya skenario yang tabnya sedang aktif yang isinya dirender, jadi
      // judul yang wajib ada adalah judul skenario pertama saja.
      harusMemuat(isi, lab[0].scenario_title[locale], 'lab_scenarios.scenario_title')
    })

    test('Timeline: perusahaan dan peran di setiap pengalaman', async ({ page, request }) => {
      const pengalaman = await koleksi<{ company: Dwibahasa; role: Dwibahasa }>(
        request, 'experiences', 'company,role,sort_order',
      )
      test.skip(pengalaman.length === 0, 'belum ada pengalaman published')

      await page.goto(`/${locale}`)
      const isi = ((await page.locator('#pengalaman').textContent()) ?? '').toLowerCase()

      for (const p of pengalaman) {
        harusMemuat(isi, p.company[locale], 'experiences.company')
        harusMemuat(isi, p.role[locale], 'experiences.role')
      }
    })

    test('Certifications: sertifikasi dan edukasi published', async ({ page, request }) => {
      const sertifikat = await koleksi<{ name: string }>(request, 'certifications', 'name,sort_order')
      const edukasi = await koleksi<{ institution: string; degree: Dwibahasa }>(
        request, 'education', 'institution,degree,sort_order',
      )
      test.skip(
        sertifikat.length === 0 && edukasi.length === 0,
        'belum ada sertifikasi maupun edukasi published',
      )

      await page.goto(`/${locale}`)
      const isi = ((await page.locator('#sertifikasi').textContent()) ?? '').toLowerCase()

      for (const s of sertifikat) harusMemuat(isi, s.name, 'certifications.name')
      for (const e of edukasi) {
        harusMemuat(isi, e.institution, 'education.institution')
        harusMemuat(isi, e.degree[locale], 'education.degree')
      }
    })

    test('Testimonials: kutipan dan nama pemberi testimoni', async ({ page, request }) => {
      const testimoni = await koleksi<{ quote: Dwibahasa; author_name: string }>(
        request, 'testimonials', 'quote,author_name,sort_order',
      )
      test.skip(testimoni.length === 0, 'belum ada testimoni published')

      await page.goto(`/${locale}`)
      const isi = ((await page.locator('#testimoni').textContent()) ?? '').toLowerCase()

      for (const t of testimoni) {
        harusMemuat(isi, t.quote[locale], 'testimonials.quote')
        harusMemuat(isi, t.author_name, 'testimonials.author_name')
      }
    })

    test('FinalCta: headline ajakan kontak', async ({ page, request }) => {
      const s = await settings(request)
      await page.goto(`/${locale}`)
      const isi = ((await page.locator('#kontak').textContent()) ?? '').toLowerCase()

      harusMemuat(isi, s.final_cta_headline[locale], 'site_settings.final_cta_headline')
    })
  })
}
