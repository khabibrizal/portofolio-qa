import { headerPemilik, tokenPemilik, urlTabel } from '../helpers/supabase-pemilik'
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

  test('/admin/skill-categories menampilkan seluruh entri database, termasuk draft', async ({
    page,
    request,
  }) => {
    await masukSebagaiAdmin(page)

    // Daftar yang diharapkan DIBACA DARI DATABASE sebagai pemilik.
    //
    // Versi sebelumnya mengunci tiga nama seed ('Manual Testing',
    // 'Automation Testing', 'Kategori Draft'), lalu gagal begitu pemiliknya
    // menamai ulang kategorinya lewat /admin — padahal daftar itu menampilkan
    // tepat apa yang tersimpan. Yang ingin dijaga di sini bukan nama tertentu,
    // melainkan bahwa daftar admin memakai klien SESI, bukan klien anonim:
    // kalau ia memakai klien anonim, entri draft hilang dari daftar dan
    // pemiliknya tidak bisa lagi menemukan tulisan yang belum diterbitkan.
    const token = await tokenPemilik(request, email!, password!)
    const res = await request.get(urlTabel('skill_categories', '?select=category_name,status'), {
      headers: headerPemilik(token),
    })
    expect(res.ok(), `gagal membaca skill_categories: HTTP ${res.status()}`).toBe(true)
    const entri = (await res.json()) as Array<{
      category_name: { id: string; en: string }
      status: string
    }>

    expect(entri.length, 'skill_categories kosong — tidak ada yang bisa diperiksa').toBeGreaterThan(0)
    expect(
      entri.some((e) => e.status === 'draft'),
      'tidak ada entri draft — kebocoran "daftar memakai klien anonim" tidak bisa terdeteksi',
    ).toBe(true)

    await page.goto('/admin/skill-categories')

    for (const e of entri) {
      await expect(
        page.getByText(e.category_name.id, { exact: true }),
        `entri "${e.category_name.id}" tidak ada di daftar admin`,
      ).toBeVisible()
    }

    // Judul diresolusikan ke bahasa Indonesia (D15), bukan ditampilkan sebagai
    // objek mentah — dan bukan pula varian EN dari entri yang sama. Kalau varian
    // EN muncul, resolusi memilih bahasa yang salah atau tidak berjalan.
    const isi = await page.locator('body').innerText()
    expect(isi, 'nilai dwibahasa dirender sebagai objek mentah').not.toContain('[object Object]')
    for (const e of entri) {
      if (e.category_name.en === e.category_name.id) continue
      expect(
        isi,
        `varian EN "${e.category_name.en}" muncul — resolusi bahasa salah`,
      ).not.toContain(e.category_name.en)
    }

    // Lencana diperiksa PER BARIS, bukan lewat cacah total.
    //
    // Versi pertama mengasersi cacah global "Draft" = 1 dan "Terbit" = 2, dan
    // itu asersi tentang keadaan BERSAMA: begitu suite lain menambah entri di
    // tabel yang sama, test ini gagal karena sebab yang tak berhubungan dengan
    // apa yang ingin dijaga. Kegagalan semacam itu mengajari orang meragukan
    // suite yang sebenarnya benar.
    //
    // Yang dijaga: entri terbit berlencana Terbit, entri draft berlencana
    // Draft, dan tidak ada yang berlencana keduanya.
    for (const e of entri) {
      const baris = page.locator('li').filter({ hasText: e.category_name.id })
      const seharusnya = e.status === 'published' ? 'Terbit' : 'Draft'
      const jangan = e.status === 'published' ? 'Draft' : 'Terbit'
      await expect(baris, `"${e.category_name.id}" tanpa lencana ${seharusnya}`).toContainText(
        seharusnya,
      )
      await expect(baris, `"${e.category_name.id}" salah berlencana ${jangan}`).not.toContainText(
        jangan,
      )
    }
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
