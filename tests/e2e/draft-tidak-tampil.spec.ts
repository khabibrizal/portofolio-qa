import { expect, test } from '@playwright/test'

// Penanda ini adalah nilai dari baris berstatus 'draft' di supabase/seed.sql —
// satu per tabel koleksi, diambil dari field yang benar-benar dirender di
// halaman (bukan field pendukung yang isinya kebetulan generik seperti
// "Draft" saja). Daftar ini diverifikasi manual terhadap seed.sql setelah
// setiap perubahan seed; dua yang terakhir (institusi & penulis) sengaja
// dibuat khas — sebelumnya keduanya cuma 'Draft', kata yang terlalu umum
// untuk diasersi dengan aman.
const PENANDA_DRAFT = [
  'Tool Draft', // tools.name
  'Kategori Draft', // skill_categories.category_name (id)
  'Draft Category', // skill_categories.category_name (en)
  'TC-999', // case_studies.test_code
  'Skenario Draft', // lab_scenarios.scenario_title (id)
  'Draft Scenario', // lab_scenarios.scenario_title (en)
  'Appium', // lab_scenarios.framework_name — satu-satunya baris memakai nilai ini
  'Perusahaan Draft', // experiences.company (id)
  'Draft Company', // experiences.company (en)
  'Sertifikat Draft', // certifications.name
  'Institusi Draft Tak Tayang', // education.institution
  'Penulis Draft Tak Tayang', // testimonials.author_name
] as const

for (const locale of ['id', 'en']) {
  test(`/${locale}: tidak satu pun baris draft tampil`, async ({ page }) => {
    await page.goto(`/${locale}`)
    // textContent, BUKAN innerText — dan dibandingkan tanpa peduli huruf besar.
    //
    // innerText mengembalikan teks HASIL RENDER, yang sudah menerapkan
    // text-transform CSS. Judul kategori di section Coverage berkelas
    // uppercase, sehingga penanda 'Kategori Draft' muncul di layar sebagai
    // 'KATEGORI DRAFT' dan pencocokan persis meleset.
    //
    // Dibuktikan: dengan filter status di queries.ts dihapus DAN kebijakan
    // RLS anon dilonggarkan jadi using (true) — dua-duanya lumpuh, draft
    // benar-benar terkirim ke halaman — versi lama test ini tetap hijau.
    // Ia tidak pernah bisa menangkap kebocoran skill_categories.
    const isi = ((await page.locator('body').textContent()) ?? '').toLowerCase()

    const bocor = PENANDA_DRAFT.filter((penanda) => isi.includes(penanda.toLowerCase()))

    expect(
      bocor,
      bocor.length > 0
        ? `penanda draft bocor ke halaman /${locale}: ${bocor.join(', ')}`
        : undefined,
    ).toEqual([])
  })
}
