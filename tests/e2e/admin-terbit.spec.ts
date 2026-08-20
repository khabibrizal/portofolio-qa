import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { headerPemilik, tokenPemilik, urlTabel } from '../helpers/supabase-pemilik'

/**
 * Siklus penuh CRUD + penerbitan `skill_categories` (Task 6), terhadap
 * DATABASE PRODUKSI sungguhan (proyek ini memakai satu database untuk dev
 * dan produksi — lihat CLAUDE.md). Karena itu:
 *
 *  - Setiap nama entri uji WAJIB berawalan `ZZ-UJI-` + stempel waktu, supaya
 *    unik antar-run dan gampang dikenali sebagai sampah test kalau tertinggal.
 *  - Pembersihan (`afterAll`) menghapus SEMUA entri `ZZ-UJI-` yang ADA di
 *    tabel saat itu — bukan cuma yang dibuat run ini — karena run sebelumnya
 *    yang gagal di tengah jalan bisa meninggalkan sisa, dan sisa yang
 *    kebetulan berstatus terbit akan tampil di situs publik sungguhan.
 *  - Dijalankan SERIAL: test kedua (data tidak valid) menghitung baris
 *    `skill_categories` sebelum/sesudah — kalau test pertama (siklus penuh)
 *    berjalan bersamaan di worker lain, cacahnya ikut berubah karena entri
 *    LAIN, bukan karena bug, dan test jadi flaky untuk alasan yang salah.
 */
test.describe('Penerbitan skill_categories — siklus penuh', () => {
  test.describe.configure({ mode: 'serial' })

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  const PREFIX = 'ZZ-UJI-'
  const STEMPEL = Date.now()
  const NAMA_AWAL = `${PREFIX}Kategori-${STEMPEL}`
  const NAMA_UBAH = `${PREFIX}Kategori-Ubah-${STEMPEL}`
  const NAMA_TIDAK_VALID = `${PREFIX}TidakValid-${STEMPEL}`

  test.beforeEach(() => {
    test.skip(
      !email || !password,
      'ADMIN_EMAIL/ADMIN_PASSWORD tidak tersedia di environment ini (mis. di CI tanpa secret) — lewati bersih, jangan gagal.',
    )
  })

  test.afterAll(async ({ request }) => {
    if (!email || !password) return // lihat beforeEach — tidak ada yang perlu dibersihkan.
    await bersihkanEntriUji(request, email, password)
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

  test('buat draft -> tak tampil di landing -> terbitkan -> tampil -> ubah -> hapus', async ({
    page,
  }) => {
    await masukSebagaiAdmin(page)

    // 1. Buka form entri baru
    await page.goto('/admin/skill-categories/baru')

    // 2. Isi category_name KEDUA bahasa + dua baris repeater skills
    await page.locator('#category_name-id').fill(NAMA_AWAL)
    await page.getByRole('tab', { name: /English/ }).click()
    await page.locator('#category_name-en').fill(NAMA_AWAL)

    await page.getByRole('button', { name: 'Tambah Keahlian' }).click()
    await page.getByRole('button', { name: 'Tambah Keahlian' }).click()
    await page.locator('#skills-0-name').fill('Playwright')
    await page.locator('#skills-0-proficiency_percent').fill('80')
    await page.locator('#skills-1-name').fill('Vitest')
    await page.locator('#skills-1-proficiency_percent').fill('70')

    // 3. Simpan sebagai draft — entri baru selalu draft (default kolom di DB),
    // `simpan` sengaja tidak pernah menyentuh `status`.
    await page.getByRole('button', { name: 'Simpan' }).click()
    await expect(page).toHaveURL(/\/admin\/skill-categories\/[0-9a-f-]{36}([?].*)?$/, { timeout: 10_000 })
    const urlEntri = page.url()

    // 4. Entri muncul di daftar admin dengan lencana draft
    await page.goto('/admin/skill-categories')
    const barisDaftar = page.locator('li', { hasText: NAMA_AWAL })
    await expect(barisDaftar).toBeVisible()
    await expect(barisDaftar.getByText('Draft', { exact: true })).toBeVisible()

    // 5. Landing /id BELUM menampilkannya — INTI PERTAMA: status draft benar-
    // benar mengendalikan apa yang publik lihat (bukan cuma soal cache).
    await page.goto('/id')
    await expect(page.locator('body')).not.toContainText(NAMA_AWAL)

    // 6. Terbitkan
    await page.goto(urlEntri)
    await page.getByRole('button', { name: 'Terbitkan' }).click()
    // Menerbitkan kini lewat dialog konfirmasi. Dilingkupi ke role dialog:
    // tombol pemicu di halaman JUGA bernama "Terbitkan", jadi pencarian tanpa
    // lingkup kena strict-mode violation (dua elemen cocok).
    await expect(page.getByRole('dialog')).toContainText('Terbitkan entri ini?')
    await page.getByRole('dialog').getByRole('button', { name: 'Terbitkan' }).click()
    await expect(page.getByText('Terbit', { exact: true })).toBeVisible({ timeout: 10_000 })

    // 7. Landing /id MENAMPILKANNYA tanpa deploy ulang — INTI KEDUA: penerbitan
    // benar-benar merambat lewat revalidatePath, bukan menunggu revalidate=300.
    await page.goto('/id')
    await expect(page.locator('body')).toContainText(NAMA_AWAL, { timeout: 10_000 })

    // 8. Ubah nama, simpan — landing ikut berubah, dan (karena `simpan` tidak
    // menyentuh status) entri TETAP terbit, bukan diam-diam kembali draft.
    await page.goto(urlEntri)
    await page.locator('#category_name-id').fill(NAMA_UBAH)
    await page.getByRole('tab', { name: /English/ }).click()
    await page.locator('#category_name-en').fill(NAMA_UBAH)
    await page.getByRole('button', { name: 'Simpan' }).click()
    await expect(page.getByText('Tersimpan.')).toBeVisible({ timeout: 10_000 })

    await page.goto('/id')
    await expect(page.locator('body')).toContainText(NAMA_UBAH, { timeout: 10_000 })
    await expect(page.locator('body')).not.toContainText(NAMA_AWAL)

    // 9. Hapus — landing tidak lagi menampilkannya
    await page.goto(urlEntri)
    // exact: true — halaman juga punya tombol "Hapus baris N" di repeater
    // skills, dan getByRole tanpa exact mencocokkan substring dari nama itu.
    await page.getByRole('button', { name: 'Hapus', exact: true }).click()
    // Hapus kini butuh konfirmasi. Label aksinya sengaja BERBEDA dari
    // pemicunya ("Hapus Permanen"), supaya isi dialog tidak bisa tertukar
    // dengan tombol yang membukanya.
    await expect(page.getByRole('dialog')).toContainText('TIDAK bisa dibatalkan')
    await page.getByRole('dialog').getByRole('button', { name: 'Hapus Permanen' }).click()
    await expect(page).toHaveURL(/\/admin\/skill-categories$/, { timeout: 10_000 })

    await page.goto('/id')
    await expect(page.locator('body')).not.toContainText(NAMA_UBAH)
  })

  test('submit dengan data tidak valid tidak menulis apa pun ke database', async ({
    page,
    request,
  }) => {
    await masukSebagaiAdmin(page)

    const token = await tokenPemilik(request, email!, password!)
    const cacahSebelum = await cacahSkillCategories(request, token)

    // `FormSkema` memvalidasi ulang dengan SKEMA YANG SAMA di klien (Task 3/4),
    // jadi mengetik data kosong di form tidak pernah sampai ke jaringan sama
    // sekali — itu cuma membuktikan validasi KLIEN. Untuk benar-benar menguji
    // bahwa `simpan` memvalidasi ulang DI SERVER (D16: Server Action bisa
    // dipanggil langsung tanpa lewat form), permintaan `simpan` yang SAH dari
    // form (klien sudah meloloskannya) disadap dan diubah jadi tidak valid
    // TEPAT sebelum meninggalkan browser — mensimulasikan permintaan yang
    // dipalsukan/dimanipulasi, persis ancaman yang harus ditahan server sendiri.
    await page.route('**/*', async (route) => {
      const req = route.request()
      if (req.method() !== 'POST') return route.continue()

      const isiAsli = req.postData()
      if (!isiAsli) return route.continue()

      let payload: unknown
      try {
        payload = JSON.parse(isiAsli)
      } catch {
        return route.continue()
      }

      const baris = Array.isArray(payload) ? (payload[2] as unknown) : undefined
      const iniPanggilanSimpan =
        Array.isArray(payload) &&
        payload.length === 3 &&
        typeof baris === 'object' &&
        baris !== null &&
        'category_name' in (baris as Record<string, unknown>)

      if (!iniPanggilanSimpan) return route.continue()

      // Timpa category_name jadi kosong — field ini wajib, jadi ini tidak
      // valid menurut skema yang sama persis dipakai `simpan` di server.
      ;(baris as Record<string, unknown>).category_name = { id: '', en: '' }
      await route.continue({ postData: JSON.stringify(payload) })
    })

    await page.goto('/admin/skill-categories/baru')
    await page.locator('#category_name-id').fill(NAMA_TIDAK_VALID)
    await page.getByRole('tab', { name: /English/ }).click()
    await page.locator('#category_name-en').fill(NAMA_TIDAK_VALID)

    // Menunggu RESPONS HTTP permintaan `simpan` itu sendiri — bukan cuma
    // mengklik lalu berharap UI-nya sudah menetap. Next.js App Router juga
    // memasang "route announcer" tersembunyi ber-`role="alert"` pada SETIAP
    // navigasi klien (dipakai screen reader untuk mengumumkan judul halaman
    // baru) — kalau test cuma menunggu *sembarang* elemen role=alert muncul,
    // elemen itu sendiri (bukan pesan error milik form ini) bisa membuat
    // assertion lolos SEBELUM permintaan sungguhan selesai, membiarkan
    // pemeriksaan berikutnya balapan dengan respons asli. Menunggu respons
    // HTTP yang konkret menghindari jebakan itu sama sekali.
    const responsSimpan = page.waitForResponse(
      (resp) => resp.request().method() === 'POST' && (resp.request().postData() ?? '').includes('category_name'),
    )
    await page.getByRole('button', { name: 'Simpan' }).click()
    await responsSimpan

    // Bukti UTAMA: cacah baris tidak bertambah. Diperiksa SEGERA setelah
    // respons HTTP selesai — di titik ini `simpan` sudah pasti selesai
    // menulis (atau menolak menulis) di server, terlepas dari seberapa
    // cepat/lambat klien merender ulang sesudahnya.
    const cacahSesudah = await cacahSkillCategories(request, token)
    expect(cacahSesudah, 'baris baru tetap tertulis meski data tidak valid').toBe(cacahSebelum)

    // Konfirmasi tambahan: server benar-benar MENOLAK lewat pesan yang
    // SPESIFIK (bukan role=alert generik — lihat catatan di atas), dan
    // TIDAK pindah ke entri baru.
    await expect(page.getByText('Data tidak valid')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/admin\/skill-categories\/baru$/)
  })
})

async function cacahSkillCategories(request: APIRequestContext, token: string): Promise<number> {
  const res = await request.get(urlTabel('skill_categories', '?select=id'), {
    headers: headerPemilik(token),
  })
  if (!res.ok()) throw new Error(`Gagal menghitung skill_categories: HTTP ${res.status()}`)
  return ((await res.json()) as unknown[]).length
}

async function bersihkanEntriUji(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const token = await tokenPemilik(request, email, password)
  const res = await request.get(urlTabel('skill_categories', '?select=id,category_name'), {
    headers: headerPemilik(token),
  })
  if (!res.ok()) {
    console.error(`[bersihkan] gagal membaca skill_categories: HTTP ${res.status()}`)
    return
  }

  const baris = (await res.json()) as { id: string; category_name: { id?: string; en?: string } }[]
  const sisa = baris.filter(
    (b) => b.category_name?.id?.startsWith('ZZ-UJI-') || b.category_name?.en?.startsWith('ZZ-UJI-'),
  )

  for (const b of sisa) {
    const hapus = await request.delete(urlTabel('skill_categories', `?id=eq.${b.id}`), {
      headers: headerPemilik(token),
    })
    if (!hapus.ok()) {
      console.error(`[bersihkan] gagal menghapus entri uji ${b.id}: HTTP ${hapus.status()}`)
    }
  }
}
