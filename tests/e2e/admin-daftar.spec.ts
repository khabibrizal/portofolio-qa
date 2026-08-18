import { expect, test, type Page } from '@playwright/test'

// Sama seperti admin-auth.spec.ts: test yang butuh sesi asli dilewati bersih
// bila kredensialnya tidak tersedia di environment ini (mis. di CI), bukan
// digagalkan atau diam-diam dilewati tanpa pesan.
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

async function masukSebagaiAdmin(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Kata sandi').fill(password!)
  await page.getByRole('button', { name: 'Masuk' }).click()
  // Timeout diperbesar — signInWithPassword dengan kredensial BENAR terukur
  // ~6-7 detik di proyek Supabase ini (lihat catatan yang sama di admin-auth.spec.ts).
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
}

test.describe('Kerangka admin dan daftar entri', () => {
  // Serial, bukan paralel: ketiganya login sungguhan dengan akun admin yang
  // SAMA. Proyek Supabase ini tampaknya membatasi satu sesi aktif per akun
  // (login baru mencabut sesi sebelumnya) — login paralel di beberapa test
  // saling menjatuhkan sesi satu sama lain secara acak, membuat test yang
  // sudah lolos login tiba-tiba dialihkan balik ke /admin/login di tengah
  // jalan. CI tidak kena ini (workers: 1 di CI, lihat playwright.config.ts),
  // tapi lokal (banyak worker) iya — makanya dipaksa serial di sini.
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(() => {
    test.skip(
      !email || !password,
      'ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia di environment ini (mis. di CI) — lewati bersih, jangan gagal.',
    )
  })

  test('/admin menampilkan koleksi Kategori Keahlian dari registry', async ({ page }) => {
    await masukSebagaiAdmin(page)

    // Scoped ke <main> (bukan seluruh halaman): sidebar kerangka JUGA
    // menampilkan tautan "Kategori Keahlian" dari registry yang sama, jadi
    // memeriksa seluruh halaman kena strict-mode violation (dua elemen).
    // Kartu daftar koleksi yang sebenarnya diuji di sini ada di <main>.
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Kategori Keahlian' }),
    ).toBeVisible()
  })

  test('/admin/skill-categories menampilkan ketiga entri seed — dua terbit, satu draft', async ({
    page,
  }) => {
    await masukSebagaiAdmin(page)
    await page.goto('/admin/skill-categories')

    // Ketiga entri seed (supabase/seed.sql) hadir, termasuk yang draft — kalau
    // draft hilang berarti daftar memakai klien anonim, bukan klien sesi
    // (lihat komentar hitungEntri/ambilEntri di lib/admin/entri.ts).
    await expect(page.getByText('Manual Testing', { exact: true })).toBeVisible()
    await expect(page.getByText('Automation Testing', { exact: true })).toBeVisible()
    await expect(page.getByText('Kategori Draft', { exact: true })).toBeVisible()

    // Judul dari category_name diresolusikan ke bahasa Indonesia (D15), bukan
    // ditampilkan sebagai objek mentah. "Draft Category" adalah varian EN dari
    // entri yang sama — kalau muncul, berarti resolusi memilih bahasa yang
    // salah (atau tidak diresolusikan sama sekali).
    const isi = await page.locator('body').innerText()
    expect(isi).not.toContain('[object Object]')
    expect(isi).not.toContain('Draft Category')

    // Lencana draft/terbit membedakan entri — dua terbit, satu draft.
    await expect(page.getByText('Draft', { exact: true })).toHaveCount(1)
    await expect(page.getByText('Terbit', { exact: true })).toHaveCount(2)
  })

  test('/admin/koleksi-ngawur menghasilkan 404, bukan 500 maupun alihan login', async ({ page }) => {
    await masukSebagaiAdmin(page)

    const res = await page.goto('/admin/koleksi-ngawur')
    expect(res?.status()).toBe(404)
    await expect(page).not.toHaveURL(/\/admin\/login/)
  })
})

test('tanpa sesi, /admin/skill-categories tetap dialihkan ke login', async ({ page }) => {
  // Menjaga janji yang sama dengan admin-auth.spec.ts, khusus untuk rute
  // [koleksi] yang baru ditambah task ini — pastikan kerangka baru tidak
  // membuka celah pada penjaga rute yang sudah ada.
  await page.goto('/admin/skill-categories')
  await expect(page).toHaveURL(/\/admin\/login/)
})
