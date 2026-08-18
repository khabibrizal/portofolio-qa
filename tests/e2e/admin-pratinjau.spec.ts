import { expect, test, type Page } from '@playwright/test'

/**
 * Rute pratinjau `/admin/pratinjau/[locale]` (Fase 2a Task 7, keputusan D14).
 *
 * Sama seperti admin-terbit.spec.ts/admin-daftar.spec.ts: test yang butuh
 * sesi asli dilewati bersih bila ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia
 * di environment ini (mis. CI tanpa secret) — bukan digagalkan, dan bukan
 * pula diam-diam dilewati tanpa pesan.
 */
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

async function masukSebagaiAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Kata sandi').fill(password!)
  await page.getByRole('button', { name: 'Masuk' }).click()
  // Timeout diperbesar — signInWithPassword dengan kredensial BENAR terukur
  // ~6-7 detik di proyek Supabase ini (catatan yang sama di admin-auth.spec.ts).
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
}

test.describe('Pratinjau draft /admin/pratinjau/[locale]', () => {
  // Global sudah workers:1 + fullyParallel:false, tapi dipertegas di sini
  // juga (konsisten dengan admin-daftar.spec.ts/admin-terbit.spec.ts) —
  // seluruhnya login dengan akun admin yang SAMA lewat sesi browser yang
  // sama, dan test 3 dengan sengaja berpindah locale di jendela page yang
  // sama.
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(() => {
    test.skip(
      !email || !password,
      'ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia di environment ini (mis. di CI tanpa secret) — lewati bersih, jangan gagal.',
    )
  })

  test('entri draft seed tampil di /admin/pratinjau/id, dan TIDAK tampil di landing /id', async ({
    page,
  }) => {
    await masukSebagaiAdmin(page)

    // "Kategori Draft" adalah baris draft skill_categories dari supabase/seed.sql
    // (sort_order 99, status 'draft') — satu-satunya sumber kebenaran soal
    // draft mana yang seharusnya ADA, bukan entri yang dibuat test ini sendiri.
    await page.goto('/admin/pratinjau/id')
    await expect(page.locator('body')).toContainText('Kategori Draft')

    // Diperiksa dalam TEST YANG SAMA (bukan spec terpisah) supaya
    // perbandingan pratinjau-vs-landing mengikat: kalau suatu saat data seed
    // berubah dan "Kategori Draft" tidak lagi ada, kedua sisi assertion sama
    // sekali tidak berarti apa-apa lagi dengan cara yang sama (keduanya
    // trivial lulus), bukan satu sisi diam-diam berhenti menguji sesuatu.
    await page.goto('/id')
    await expect(page.locator('body')).not.toContainText('Kategori Draft')
  })

  test('panel ringkasan menyebut entri draft yang ada', async ({ page }) => {
    await masukSebagaiAdmin(page)
    await page.goto('/admin/pratinjau/id')

    const panel = page.locator('#ringkasan-draft')
    await expect(panel.getByRole('heading', { name: /Entri Draft/ })).toBeVisible()
    await expect(panel.getByText('Kategori Keahlian', { exact: false })).toBeVisible()
    await expect(panel.getByText('Kategori Draft', { exact: true })).toBeVisible()
  })

  test('spanduk pratinjau tampil di /admin/pratinjau/id, dan TIDAK tampil di landing /id', async ({
    page,
  }) => {
    await masukSebagaiAdmin(page)

    await page.goto('/admin/pratinjau/id')
    await expect(page.locator('#spanduk-pratinjau')).toBeVisible()
    await expect(page.getByText('Halaman Pratinjau', { exact: false })).toBeVisible()
    await expect(page.getByText(/bukan halaman publik/i)).toBeVisible()

    await page.goto('/id')
    await expect(page.locator('#spanduk-pratinjau')).toHaveCount(0)
    await expect(page.getByText('Halaman Pratinjau', { exact: false })).toHaveCount(0)
  })

  test('/admin/pratinjau/en menampilkan varian bahasa Inggris dari entri draft', async ({
    page,
  }) => {
    await masukSebagaiAdmin(page)
    await page.goto('/admin/pratinjau/en')
    await expect(page.locator('body')).toContainText('Draft Category')
  })

  test('/admin/pratinjau/jv menghasilkan 404', async ({ page }) => {
    await masukSebagaiAdmin(page)
    const res = await page.goto('/admin/pratinjau/jv')
    expect(res?.status()).toBe(404)
  })
})

test('tanpa sesi, /admin/pratinjau/id dialihkan ke login', async ({ page }) => {
  // Redundan dengan loop rute terjaga di admin-auth.spec.ts (yang sudah
  // memasukkan path ini) — dipertahankan di sini juga supaya suite Task 7
  // berdiri sendiri kalau dibaca terpisah, dan TIDAK butuh kredensial admin
  // (makanya di LUAR describe yang di-skip beforeEach di atas).
  await page.goto('/admin/pratinjau/id')
  await expect(page).toHaveURL(/\/admin\/login/)
})

// Kasus 7 (PALING PENTING menurut rencana Task 7): mengekstrak
// `KomposisiHalaman` menyentuh jalur render LANDING itu sendiri. Kalau
// sumber datanya tertukar — landing diam-diam memanggil
// `getPageContentPratinjau()` alih-alih `getPageContent()` — draft bocor ke
// publik, dan itu kegagalan paling serius yang mungkin terjadi di fase ini.
//
// Pemeriksaan ini TIDAK butuh sesi admin (landing selalu publik untuk
// siapa pun), jadi ditulis di luar describe yang di-skip, dan berjalan
// SELALU — bahkan tanpa ADMIN_EMAIL/ADMIN_PASSWORD di CI. Ini juga
// mencerminkan pemeriksaan yang sama dengan `draft-tidak-tampil.spec.ts`,
// diulang di sini secara sengaja supaya suite Task 7 memuat bukti sendiri
// bahwa ekstraksi komposisinya tidak membocorkan draft ke landing.
test.describe('Landing tetap tidak memuat penanda draft (redundan terhadap draft-tidak-tampil.spec.ts)', () => {
  const PENANDA_DRAFT = ['Kategori Draft', 'Draft Category']

  for (const locale of ['id', 'en']) {
    test(`/${locale} tidak memuat penanda draft skill_categories`, async ({ page }) => {
      await page.goto(`/${locale}`)
      const isi = await page.locator('body').innerText()

      for (const penanda of PENANDA_DRAFT) {
        expect(isi, `penanda draft "${penanda}" bocor ke /${locale}`).not.toContain(penanda)
      }
    })
  }
})
