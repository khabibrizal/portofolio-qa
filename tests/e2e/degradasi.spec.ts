import { expect, test } from '@playwright/test'

const LOCALES = ['id', 'en'] as const

// Anchor yang ditautkan Nav — lihat src/components/layout/Nav.tsx (`TAUTAN`).
// Kalau salah satu section berhenti merender id-nya (mis. salah rename saat
// refactor), tautan Nav menunjuk ke tempat yang tidak ada — kerusakan yang
// tidak pernah error, cuma diam-diam tidak bisa diklik.
const ANCHOR_NAV = ['tentang', 'coverage', 'studi-kasus', 'automation-lab', 'pengalaman'] as const

for (const locale of LOCALES) {
  test(`/${locale}: halaman merender <main> dan <footer>`, async ({ page }) => {
    await page.goto(`/${locale}`)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test(`/${locale}: tidak pernah menampilkan layar error Next.js`, async ({ page }) => {
    const res = await page.goto(`/${locale}`)
    expect(res?.status()).toBe(200)

    const isi = await page.locator('body').innerText()
    expect(isi).not.toContain('Application error')
    expect(isi).not.toContain('This page could not be found')
  })

  test(`/${locale}: tidak ada error runtime di konsol saat memuat halaman`, async ({ page }) => {
    const errorRuntime: string[] = []
    page.on('pageerror', (err) => errorRuntime.push(err.message))

    await page.goto(`/${locale}`)
    // Beri kesempatan efek client (SkillBars, LabRunner, LanguageSwitcher)
    // untuk mount dan berjalan sebelum diperiksa.
    await page.waitForLoadState('networkidle')

    expect(errorRuntime, `error runtime tak terduga: ${errorRuntime.join(' | ')}`).toEqual([])
  })

  test(`/${locale}: seluruh anchor yang ditautkan Nav benar-benar ada di halaman`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`)

    for (const anchor of ANCHOR_NAV) {
      await expect(
        page.locator(`#${anchor}`),
        `anchor #${anchor} yang ditautkan Nav tidak ditemukan di halaman`,
      ).toHaveCount(1)
    }
  })
}

/**
 * Batas yang jujur — apa yang suite ini TIDAK buktikan.
 *
 * Test di atas menembak database yang hidup dan sehat (via `npm run db:reset`
 * di CI/lokal), lalu mengosongkan section satu per satu secara manual di
 * Task 9 Langkah 4 (skrip sementara, dihapus setelah dipakai, di luar suite
 * ini) untuk membuktikan bahwa satu koleksi kosong tidak menjatuhkan section
 * lain. Yang TIDAK diuji di sini — dan memang tidak bisa diuji dari
 * Playwright — adalah skenario "database benar-benar mati" (koneksi refused,
 * timeout total, kredensial salah).
 *
 * Alasannya struktural: `getPageContent()` berjalan di server, di dalam
 * request-time rendering Next.js untuk RSC. Playwright hanya melihat HTML/JS
 * yang sudah keluar dari server itu — tidak ada cara mencegat atau mensimulasi
 * kegagalan koneksi database dari sisi peramban, karena permintaan ke
 * Supabase tidak pernah melewati jaringan yang bisa dilihat test ini.
 *
 * Perlindungan untuk kasus "database mati total" bersandar sepenuhnya pada
 * ISR/prerendering (`export const revalidate = 300` di
 * `src/app/[locale]/page.tsx`): halaman `/id` dan `/en` di-generate sebagai
 * HTML statis saat build (`● /id`, `● /en` di output `npm run build`), dan
 * ketika revalidasi berikutnya gagal karena database tidak terjangkau,
 * Next.js tetap menyajikan render terakhir yang berhasil — pengunjung tidak
 * pernah melihat kegagalan itu. Jaminan itu diverifikasi lewat pembacaan
 * output `npm run build` di setiap task (lihat catatan Task 3), bukan lewat
 * eksekusi test di suite ini.
 */
