import { expect, test } from '@playwright/test'

// Padanan tests/e2e/landing-id.spec.ts untuk /en — nilai seed yang bilingual
// sengaja diisi identik di kolom id/en (lihat supabase/seed.sql), jadi
// assertion di sini sama; yang membedakan i18n sungguh bekerja diuji lewat
// field yang isinya sengaja berbeda (ditambahkan bersama section About).
test.describe('/en — konten dari database', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en')
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
