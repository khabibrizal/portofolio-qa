import { expect, test } from '@playwright/test'

// Memverifikasi bahwa nilai dari seed database benar-benar tampil di /id —
// bukan sekadar elemen ada, tapi teksnya cocok dengan supabase/seed.sql.
test.describe('/id — konten dari database', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id')
  })

  test('Hero menampilkan role, intro, stats, dan konsol status', async ({ page }) => {
    const isi = await page.locator('body').innerText()

    expect(isi).toContain('QA Engineer — Manual & Automation Testing')

    for (const stat of ['4+', '1.200+', '350+', '70%']) {
      expect(isi).toContain(stat)
    }

    for (const cek of ['Manual Testing', 'Automation (Playwright)']) {
      expect(isi).toContain(cek)
    }
  })

  test('TrustStrip menampilkan daftar tools published', async ({ page }) => {
    const isi = await page.locator('body').innerText()

    for (const tool of ['Playwright', 'Postman', 'k6']) {
      expect(isi).toContain(tool)
    }
  })
})
