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

  test('tidak ada halaman pendaftaran publik', async ({ page }) => {
    for (const rute of ['/admin/daftar', '/admin/signup', '/admin/register']) {
      const res = await page.goto(rute)
      expect(res?.status(), `${rute} seharusnya tidak ada`).toBe(404)
    }
  })
})
