import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { headerPemilik, tokenPemilik, urlTabel } from '../helpers/supabase-pemilik'

/**
 * Siklus penuh CRUD + penerbitan untuk keempat koleksi sederhana Task 4
 * (`tools`, `certifications`, `education`, `testimonials`), terhadap
 * DATABASE PRODUKSI sungguhan (proyek ini memakai satu database untuk dev
 * dan produksi — lihat CLAUDE.md). Sama seperti `admin-terbit.spec.ts`:
 *
 *  - Setiap nama entri uji WAJIB berawalan `ZZ-UJI-` + stempel waktu.
 *  - Pembersihan (`afterAll`) menghapus SEMUA entri `ZZ-UJI-` yang ADA di
 *    KEEMPAT tabel saat itu — bukan cuma yang dibuat run ini — supaya sisa
 *    dari run sebelumnya yang gagal di tengah jalan (dan berstatus terbit)
 *    tidak tertinggal tayang di situs publik sungguhan. `afterAll` ini
 *    SELALU jalan, terlepas dari test mana yang gagal di tengah.
 *  - Dijalankan SERIAL: test cacah baris (dua test terakhir) menghitung
 *    baris sebelum/sesudah — kalau test lain berjalan bersamaan di worker
 *    lain, cacahnya ikut berubah karena entri LAIN, bukan karena bug.
 */
test.describe('Empat koleksi sederhana (tools, certifications, education, testimonials)', () => {
  test.describe.configure({ mode: 'serial' })

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  const PREFIX = 'ZZ-UJI-'
  const STEMPEL = Date.now()

  const TABEL_UJI: { tabel: string; kolom: string }[] = [
    { tabel: 'tools', kolom: 'name' },
    { tabel: 'certifications', kolom: 'name' },
    { tabel: 'education', kolom: 'institution' },
    { tabel: 'testimonials', kolom: 'author_name' },
  ]

  test.beforeEach(() => {
    test.skip(
      !email || !password,
      'ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia di environment ini (mis. di CI tanpa secret) — lewati bersih, jangan gagal.',
    )
  })

  test.afterAll(async ({ request }) => {
    if (!email || !password) return // lihat beforeEach — tidak ada yang perlu dibersihkan.

    const token = await tokenPemilik(request, email, password)
    for (const { tabel, kolom } of TABEL_UJI) {
      await bersihkanEntriUji(request, token, tabel, kolom)
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

  /**
   * Field `terlokalisasi`/`terlokalisasi-panjang` hanya merender SATU input
   * pada satu waktu (tab bahasa aktif) — lihat `FieldTerlokalisasi.tsx`.
   * Beberapa koleksi di sini (`education.degree`, `testimonials.quote`,
   * `testimonials.author_role`) punya LEBIH dari satu field dwibahasa di
   * halaman yang sama, jadi tombol tab "English" generik (`getByRole('tab',
   * { name: /English/ })`) tidak unik di level halaman — ia harus di-scope
   * ke wrapper field yang benar. Wrapper itu adalah parent langsung dari
   * input `-id` (lihat struktur `FieldTerlokalisasi`), dicari lewat elemen
   * inputnya sendiri yang id-nya SELALU unik per field.
   */
  async function isiTerlokalisasi(page: Page, jalur: string, nilaiId: string, nilaiEn: string) {
    const inputIndo = page.locator(`#${jalur}-id`)
    await inputIndo.fill(nilaiId)
    const wrapper = inputIndo.locator('xpath=..')
    await wrapper.getByRole('tab', { name: /English/ }).click()
    await page.locator(`#${jalur}-en`).fill(nilaiEn)
  }

  async function isiTools(page: Page, nama: string) {
    await page.locator('#name').fill(nama)
  }

  async function isiCertifications(page: Page, nama: string) {
    await page.locator('#name').fill(nama)
    await page.locator('#issuer').fill('ISTQB (uji otomatis)')
    await page.locator('#year').fill('2024')
  }

  async function isiEducation(page: Page, nama: string) {
    await page.locator('#institution').fill(nama)
    await isiTerlokalisasi(page, 'degree', 'S1 Uji Otomatis', 'B.Sc. Automated Test')
    await page.locator('#year').fill('2024')
  }

  async function isiTestimonials(page: Page, nama: string) {
    await isiTerlokalisasi(page, 'quote', 'Kutipan uji otomatis.', 'Automated test quote.')
    await page.locator('#author_name').fill(nama)
    await isiTerlokalisasi(page, 'author_role', 'QA Uji Otomatis', 'Automated QA Tester')
  }

  /**
   * Siklus umum: buat draft -> tak tampil di landing -> terbitkan -> tampil
   * -> hapus -> tak tampil lagi. Sama persis alurnya dengan
   * `admin-terbit.spec.ts` (skill_categories), diparameterkan per koleksi
   * supaya keempatnya tidak menyalin blok yang identik empat kali.
   */
  async function jalankanSiklusPenuh(
    page: Page,
    slug: string,
    isiForm: (page: Page, nama: string) => Promise<void>,
    penanda: string,
  ) {
    // 1. Buka form entri baru, isi, simpan sebagai draft.
    await page.goto(`/admin/${slug}/baru`)
    await isiForm(page, penanda)
    await page.getByRole('button', { name: 'Simpan' }).click()
    // Query opsional: menyimpan entri baru membawa `?tersimpan=baru` sebagai
    // penanda pesan "tersimpan sebagai draft" di halaman tujuan.
    //
    // Dipakai kelas karakter `[?]`, bukan `\?`: di dalam template literal,
    // backslash-nya dimakan string dan RegExp menerima `?` telanjang —
    // menghasilkan grup cacat `(?.*)` dan galat "Invalid group". Kelas karakter
    // tidak butuh escape sama sekali, jadi jebakannya hilang.
    await expect(page).toHaveURL(new RegExp(`/admin/${slug}/[0-9a-f-]{36}([?].*)?$`), {
      timeout: 10_000,
    })
    const urlEntri = page.url()

    // 2. Entri muncul di daftar admin dengan lencana draft.
    await page.goto(`/admin/${slug}`)
    const barisDaftar = page.locator('li', { hasText: penanda })
    await expect(barisDaftar).toBeVisible()
    await expect(barisDaftar.getByText('Draft', { exact: true })).toBeVisible()

    // 3. Landing /id BELUM menampilkannya.
    await page.goto('/id')
    await expect(page.locator('body')).not.toContainText(penanda)

    // 4. Terbitkan.
    await page.goto(urlEntri)
    await page.getByRole('button', { name: 'Terbitkan' }).click()
    // Menerbitkan kini lewat dialog konfirmasi. Dilingkupi ke role dialog:
    // tombol pemicu di halaman JUGA bernama "Terbitkan", jadi pencarian tanpa
    // lingkup kena strict-mode violation (dua elemen cocok).
    await expect(page.getByRole('dialog')).toContainText('Terbitkan entri ini?')
    await page.getByRole('dialog').getByRole('button', { name: 'Terbitkan' }).click()
    await expect(page.getByText('Terbit', { exact: true })).toBeVisible({ timeout: 10_000 })

    // 5. Landing /id MENAMPILKANNYA tanpa deploy ulang (revalidatePath).
    await page.goto('/id')
    await expect(page.locator('body')).toContainText(penanda, { timeout: 10_000 })

    // 6. Hapus — landing tidak lagi menampilkannya.
    await page.goto(urlEntri)
    // exact: true — beberapa form di sini (mis. repeater kalau ada) bisa
    // punya tombol lain yang namanya mengandung "Hapus" sebagai substring.
    await page.getByRole('button', { name: 'Hapus', exact: true }).click()
    // Hapus kini butuh konfirmasi. Label aksinya sengaja BERBEDA dari
    // pemicunya ("Hapus Permanen"), supaya isi dialog tidak bisa tertukar
    // dengan tombol yang membukanya.
    await expect(page.getByRole('dialog')).toContainText('TIDAK bisa dibatalkan')
    await page.getByRole('dialog').getByRole('button', { name: 'Hapus Permanen' }).click()
    await expect(page).toHaveURL(new RegExp(`/admin/${slug}$`), { timeout: 10_000 })

    await page.goto('/id')
    await expect(page.locator('body')).not.toContainText(penanda)
  }

  test('tools: buat draft -> tak tampil -> terbitkan -> tampil -> hapus', async ({ page }) => {
    await masukSebagaiAdmin(page)
    await jalankanSiklusPenuh(page, 'tools', isiTools, `${PREFIX}Tool-${STEMPEL}`)
  })

  test('certifications: buat draft -> tak tampil -> terbitkan -> tampil -> hapus', async ({ page }) => {
    await masukSebagaiAdmin(page)
    await jalankanSiklusPenuh(page, 'certifications', isiCertifications, `${PREFIX}Sertifikat-${STEMPEL}`)
  })

  test('education: buat draft -> tak tampil -> terbitkan -> tampil -> hapus', async ({ page }) => {
    await masukSebagaiAdmin(page)
    await jalankanSiklusPenuh(page, 'education', isiEducation, `${PREFIX}Institusi-${STEMPEL}`)
  })

  test('testimonials: buat draft -> tak tampil -> terbitkan -> tampil -> hapus', async ({ page }) => {
    await masukSebagaiAdmin(page)
    await jalankanSiklusPenuh(page, 'testimonials', isiTestimonials, `${PREFIX}Penulis-${STEMPEL}`)
  })

  test('certifications: year di bawah 1990 ditolak form, tidak menulis baris baru', async ({
    page,
    request,
  }) => {
    await masukSebagaiAdmin(page)
    const token = await tokenPemilik(request, email!, password!)
    const cacahSebelum = await cacahBaris(request, token, 'certifications')

    await page.goto('/admin/certifications/baru')
    await page.locator('#name').fill(`${PREFIX}TahunSalah-${STEMPEL}`)
    await page.locator('#issuer').fill('ISTQB (uji otomatis)')
    await page.locator('#year').fill('1800')
    await page.getByRole('button', { name: 'Simpan' }).click()

    // Bukti UTAMA: cacah baris TIDAK bertambah. Validasi di sini murni klien
    // (Zod `safeParse` di `FormSkema` — lihat komentar di sana: Server Action
    // `simpan` TIDAK PERNAH dipanggil ketika validasi klien gagal), jadi
    // submit ini tidak pernah menyentuh jaringan sama sekali. Cacah tetap
    // diperiksa lewat API mentah (bukan cuma dipercaya dari perilaku klien)
    // supaya buktinya independen dari asumsi soal alur form.
    const cacahSesudah = await cacahBaris(request, token, 'certifications')
    expect(cacahSesudah, 'baris baru tetap tertulis meski year di luar rentang').toBe(cacahSebelum)

    // Pesan error diperiksa lewat id SPESIFIK milik field `year`
    // (`#year-error`, ditulis `FieldAngka.tsx`) — BUKAN `role="alert"` secara
    // generik. Next.js App Router memasang "route announcer" tersembunyi
    // ber-`role="alert"` pada SETIAP navigasi klien (dipakai screen reader
    // mengumumkan judul halaman baru); menunggu *sembarang* elemen
    // role=alert pernah membuat test di proyek ini lolos palsu karena
    // elemen itu — bukan pesan error form ini — yang muncul duluan.
    await expect(page.locator('#year-error')).toBeVisible()
    await expect(page.locator('#year-error')).toContainText('Minimal 1990')
    // Tetap di rute "entri baru" — tidak pernah pindah ke rute entri
    // tersimpan, konfirmasi tambahan bahwa tidak ada apa pun yang tersimpan.
    await expect(page).toHaveURL(/\/admin\/certifications\/baru$/)
  })

  test('education: year di atas 2100 ditolak form, tidak menulis baris baru', async ({ page, request }) => {
    await masukSebagaiAdmin(page)
    const token = await tokenPemilik(request, email!, password!)
    const cacahSebelum = await cacahBaris(request, token, 'education')

    await page.goto('/admin/education/baru')
    await page.locator('#institution').fill(`${PREFIX}TahunSalah-${STEMPEL}`)
    await isiTerlokalisasi(page, 'degree', 'S1 Uji Otomatis', 'B.Sc. Automated Test')
    await page.locator('#year').fill('2200')
    await page.getByRole('button', { name: 'Simpan' }).click()

    // Sama seperti test certifications di atas: cacah baris via API adalah
    // bukti utama, bukan sekadar munculnya pesan error.
    const cacahSesudah = await cacahBaris(request, token, 'education')
    expect(cacahSesudah, 'baris baru tetap tertulis meski year di luar rentang').toBe(cacahSebelum)

    await expect(page.locator('#year-error')).toBeVisible()
    await expect(page.locator('#year-error')).toContainText('Maksimal 2100')
    await expect(page).toHaveURL(/\/admin\/education\/baru$/)
  })
})

async function cacahBaris(request: APIRequestContext, token: string, tabel: string): Promise<number> {
  const res = await request.get(urlTabel(tabel, '?select=id'), { headers: headerPemilik(token) })
  if (!res.ok()) throw new Error(`Gagal menghitung ${tabel}: HTTP ${res.status()}`)
  return ((await res.json()) as unknown[]).length
}

async function bersihkanEntriUji(
  request: APIRequestContext,
  token: string,
  tabel: string,
  kolom: string,
): Promise<void> {
  const res = await request.get(urlTabel(tabel, `?select=id,${kolom}`), {
    headers: headerPemilik(token),
  })
  if (!res.ok()) {
    console.error(`[bersihkan] gagal membaca ${tabel}: HTTP ${res.status()}`)
    return
  }

  const baris = (await res.json()) as Record<string, unknown>[]
  const sisa = baris.filter((b) => typeof b[kolom] === 'string' && (b[kolom] as string).startsWith('ZZ-UJI-'))

  for (const b of sisa) {
    const hapus = await request.delete(urlTabel(tabel, `?id=eq.${b.id}`), {
      headers: headerPemilik(token),
    })
    if (!hapus.ok()) {
      console.error(`[bersihkan] gagal menghapus entri uji ${tabel}/${b.id}: HTTP ${hapus.status()}`)
    }
  }
}
