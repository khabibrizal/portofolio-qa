import { expect, test } from '@playwright/test'

test('halaman utama merespons 200 dan menetapkan bahasa dokumen', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})
