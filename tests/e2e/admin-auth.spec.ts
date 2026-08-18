import { expect, test } from '@playwright/test'

test.describe('Penjaga rute admin', () => {
  for (const rute of ['/admin', '/admin/skill-categories', '/admin/pratinjau/id']) {
    test(`${rute} tanpa sesi dialihkan ke halaman login`, async ({ page }) => {
      await page.goto(rute)
      await expect(page).toHaveURL(/\/admin\/login/)
    })
  }

  test('halaman login bisa diakses tanpa sesi', async ({ page }) => {
    const res = await page.goto('/admin/login')
    expect(res?.status()).toBe(200)
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Kata sandi')).toBeVisible()
  })

  test('tidak ada rute yang menyajikan formulir pendaftaran', async ({ page }) => {
    // Versi pertama test ini menuntut status 404, dan itu rumusan yang salah:
    // proxy memang mengalihkan seluruh /admin/* yang belum berotorisasi ke
    // login, sehingga path apa pun menjawab 200. Untuk memenuhinya, kode
    // produksi sempat diberi daftar path yang DILEWATKAN dari pemeriksaan
    // sesi — artinya begitu ada yang membuat halaman di salah satu path itu,
    // halamannya terbuka tanpa login. Test yang salah rumus melahirkan lubang
    // keamanan; rumusannya diperbaiki, dan daftar itu dibuang.
    //
    // Yang benar-benar dijaga bukan kode statusnya, melainkan bahwa tidak ada
    // tempat untuk mendaftar. Sisi kodenya dijaga tests/unit/tanpa-pendaftaran.test.ts.
    for (const rute of ['/admin/daftar', '/admin/signup', '/admin/register']) {
      await page.goto(rute)
      await expect(page, `${rute} seharusnya berujung di login`).toHaveURL(/\/admin\/login/)

      const isi = await page.locator('body').innerText()
      for (const kata of ['Daftar', 'Sign up', 'Buat akun', 'Register']) {
        expect(isi, `${rute} menampilkan ajakan mendaftar: "${kata}"`).not.toContain(kata)
      }
    }
  })

  test('login dengan kredensial salah menampilkan pesan, bukan halaman error', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill('bukan@ada.test')
    await page.getByLabel('Kata sandi').fill('salah-sekali')
    await page.getByRole('button', { name: 'Masuk' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})

test.describe('Login dan logout dengan kredensial benar', () => {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  test('masuk -> tampil email -> keluar -> /admin dialihkan lagi ke login', async ({ page }) => {
    test.skip(
      !email || !password,
      'ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia di environment ini (mis. di CI) — lewati bersih, jangan gagal.',
    )

    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email!)
    await page.getByLabel('Kata sandi').fill(password!)
    await page.getByRole('button', { name: 'Masuk' }).click()

    // 1 & 2: berujung di /admin. Timeout diperbesar (bukan default 5s) karena
    // signInWithPassword ke Supabase Auth pada proyek ini terukur ~6-7 detik
    // untuk kredensial yang BENAR (login gagal justru cepat) — bukan bug kode.
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 })

    // 3: ada penanda akun yang sedang masuk
    await expect(page.getByText(email!)).toBeVisible()

    // 4: menekan keluar mengembalikan ke /admin/login
    await page.getByRole('button', { name: 'Keluar' }).click()
    await expect(page).toHaveURL(/\/admin\/login/)

    // 5: setelah keluar, membuka /admin lagi dialihkan ke login
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
