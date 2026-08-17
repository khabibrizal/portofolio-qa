import { expect, test } from '@playwright/test'

test('/id merender dan menetapkan lang=id', async ({ page }) => {
  const res = await page.goto('/id')
  expect(res?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})

test('/en merender dan menetapkan lang=en', async ({ page }) => {
  const res = await page.goto('/en')
  expect(res?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('/ mengalihkan ke salah satu locale', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(id|en)$/)
})

test('kedua halaman memuat hreflang yang saling menunjuk', async ({ page }) => {
  for (const locale of ['id', 'en']) {
    await page.goto(`/${locale}`)
    const id = page.locator('link[rel="alternate"][hreflang="id"]')
    const en = page.locator('link[rel="alternate"][hreflang="en"]')
    await expect(id).toHaveCount(1)
    await expect(en).toHaveCount(1)
    await expect(id).toHaveAttribute('href', /\/id$/)
    await expect(en).toHaveAttribute('href', /\/en$/)
  }
})

test('locale yang tidak dikenal menghasilkan 404', async ({ page }) => {
  const res = await page.goto('/jv')
  expect(res?.status()).toBe(404)
})
