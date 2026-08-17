import { expect, test } from '@playwright/test'

// Sejak Task 3 (routing [locale]), `/` mengalihkan ke `/id` atau `/en` sesuai
// Accept-Language peramban — lihat tests/e2e/rute-locale.spec.ts untuk cakupan
// penuh perilaku pengalihan tsb. Test ini hanya memastikan halaman akhirnya
// merespons 200 dan dokumen punya salah satu locale yang didukung.
test('halaman utama merespons 200 dan menetapkan bahasa dokumen', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', /^(id|en)$/)
})
