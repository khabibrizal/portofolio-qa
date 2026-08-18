import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { headerPemilik, tokenPemilik, urlTabel } from '../helpers/supabase-pemilik'

/**
 * Rute singleton (D21) — `site_settings`, `hero`, `about`. Test yang MENGUBAH
 * data (kasus 3) berjalan terhadap DATABASE PRODUKSI sungguhan (lihat
 * CLAUDE.md), jadi:
 *
 *  - Nilai lama `hero.full_name` dibaca dulu SEBELUM diubah, dan dipulihkan
 *    di `afterAll` yang SELALU jalan (bukan cuma saat test lulus) — ini
 *    field yang tampil di halaman publik `/id`, jadi tidak boleh
 *    meninggalkan jejak `ZZ-UJI-` di situs yang tayang.
 *  - Dijalankan SERIAL: beberapa test login dengan akun admin yang sama
 *    (lihat catatan yang sama di admin-daftar.spec.ts/admin-terbit.spec.ts) —
 *    login paralel saling mencabut sesi satu sama lain di proyek Supabase ini.
 */
test.describe('Rute singleton (site_settings, hero, about)', () => {
  test.describe.configure({ mode: 'serial' })

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  const STEMPEL = Date.now()
  const NAMA_UJI = `ZZ-UJI-Nama-${STEMPEL}`
  let namaAsli: string | undefined

  test.beforeEach(() => {
    test.skip(
      !email || !password,
      'ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia di environment ini (mis. di CI) — lewati bersih, jangan gagal.',
    )
  })

  test.afterAll(async ({ request }) => {
    if (!email || !password) return // lihat beforeEach — tidak ada yang perlu dipulihkan.
    if (namaAsli === undefined) return // kasus 3 tidak sempat jalan (mis. skip) — tidak ada yang berubah.

    const token = await tokenPemilik(request, email, password)
    const res = await request.patch(urlTabel('hero', '?id=eq.1'), {
      headers: headerPemilik(token),
      data: { full_name: namaAsli },
    })
    if (!res.ok()) {
      console.error(`[pulihkan hero.full_name] gagal: HTTP ${res.status()}`)
    }
  })

  async function masukSebagaiAdmin(page: Page) {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email!)
    await page.getByLabel('Kata sandi').fill(password!)
    await page.getByRole('button', { name: 'Masuk' }).click()
    // Timeout diperbesar — signInWithPassword pada proyek ini terukur ~6-7 detik
    // untuk kredensial BENAR (lihat catatan sama di admin-auth.spec.ts).
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })
  }

  async function bacaFullNameAsli(request: APIRequestContext): Promise<string> {
    const token = await tokenPemilik(request, email!, password!)
    const res = await request.get(urlTabel('hero', '?id=eq.1&select=full_name'), {
      headers: headerPemilik(token),
    })
    if (!res.ok()) throw new Error(`Gagal membaca hero.full_name: HTTP ${res.status()}`)
    const baris = (await res.json()) as { full_name: string }[]
    if (baris.length === 0) throw new Error('Baris hero (id=1) tidak ditemukan')
    return baris[0]!.full_name
  }

  test('/admin menampilkan ketiga singleton dari registry', async ({ page }) => {
    await masukSebagaiAdmin(page)

    // Scoped ke sidebar (nav kerangka admin) — sama seperti admin-daftar.spec.ts,
    // koleksi biasa JUGA muncul di kartu daftar utama, jadi cukup buktikan
    // ketiga singleton ada di navigasi tanpa asumsi soal daftar utama.
    const nav = page.locator('aside nav').first()
    await expect(nav.getByRole('link', { name: 'Pengaturan Situs' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Hero' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Tentang Saya' })).toBeVisible()
  })

  test('membuka singleton langsung menampilkan form, bukan daftar entri', async ({ page }) => {
    await masukSebagaiAdmin(page)

    await page.goto('/admin/hero')

    // Dialihkan langsung ke rute form baris satu-satunya (id=1) — bukan
    // menetap di rute daftar.
    await expect(page).toHaveURL(/\/admin\/hero\/1$/)

    // Form muncul (field wajib `full_name` ada)...
    await expect(page.locator('#full_name')).toBeVisible()

    // ...dan yang jadi ciri daftar entri SAMA SEKALI tidak ada: tidak ada
    // tombol "Tambah", tidak ada tautan "Kembali ke daftar", tidak ada
    // badge Draft/Terbit (konsep yang tidak berlaku untuk singleton — D21).
    await expect(page.getByRole('link', { name: /^Tambah/ })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Kembali ke daftar' })).toHaveCount(0)
    await expect(page.getByText('Draft', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Terbit', { exact: true })).toHaveCount(0)
  })

  test('ubah full_name di hero, simpan, dan landing /id ikut berubah', async ({ page, request }) => {
    await masukSebagaiAdmin(page)

    namaAsli = await bacaFullNameAsli(request)

    await page.goto('/admin/hero/1')
    await page.locator('#full_name').fill(NAMA_UJI)
    await page.getByRole('button', { name: 'Simpan' }).click()
    await expect(page.getByText('Tersimpan.')).toBeVisible({ timeout: 10_000 })

    // Landing /id merambat TANPA deploy ulang (revalidatePath, sama seperti
    // penerbitan skill_categories di admin-terbit.spec.ts).
    await page.goto('/id')
    await expect(page.locator('body')).toContainText(NAMA_UJI, { timeout: 10_000 })
  })

  test('form site_settings menampilkan kontrol pilihan availability_status dengan ketiga opsinya', async ({
    page,
  }) => {
    await masukSebagaiAdmin(page)
    await page.goto('/admin/site-settings')
    await expect(page).toHaveURL(/\/admin\/site-settings\/1$/)

    const select = page.locator('#availability_status')
    await expect(select).toBeVisible()

    const nilaiOpsi = await select.locator('option').evaluateAll((opsi) =>
      opsi.map((o) => (o as HTMLOptionElement).value),
    )
    expect(nilaiOpsi).toEqual(expect.arrayContaining(['available', 'open', 'unavailable']))
  })

  test('form hero menampilkan grup kedua CTA dan repeater key_stats dari seed', async ({ page }) => {
    await masukSebagaiAdmin(page)
    await page.goto('/admin/hero/1')

    // Kedua grup CTA (D20) — role="group" ber-aria-label label field-nya
    // (lihat FieldGrup.tsx), masing-masing dengan anak label+link.
    const ctaUtama = page.getByRole('group', { name: 'CTA Utama' })
    await expect(ctaUtama).toBeVisible()
    await expect(page.locator('#cta_primary-link')).toBeVisible()

    const ctaKedua = page.getByRole('group', { name: 'CTA Kedua' })
    await expect(ctaKedua).toBeVisible()
    await expect(page.locator('#cta_secondary-link')).toBeVisible()

    // Repeater key_stats berisi baris dari seed (supabase/seed.sql), bukan
    // repeater kosong — diperiksa lewat nilai FIELD-nya langsung (bukan
    // lencana "Baris N" generik FieldRepeater, yang dipakai ULANG oleh
    // status_checks juga sehingga tidak unik per repeater). Baris pertama
    // dari seed adalah "Tahun Pengalaman" / "4+".
    await expect(page.locator('#key_stats-0-value')).toHaveValue('4+')
  })
})
