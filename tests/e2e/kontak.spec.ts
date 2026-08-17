import { expect, test } from '@playwright/test'

// Menguji tautan kontak yang gampang salah format: skema mailto, nomor
// WhatsApp yang wajib dibersihkan dari "+"/spasi/hubung, dan URL sosial
// yang harus persis sama dengan seed — bukan sekadar elemen ada.
for (const locale of ['id', 'en']) {
  test.describe(`/${locale} — tautan kontak`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/${locale}`)
    })

    test('tautan email memakai skema mailto: dan memuat alamat seed', async ({ page }) => {
      const email = page.locator('a[href^="mailto:"]').first()
      await expect(email).toHaveAttribute('href', 'mailto:kontak@contoh.dev')
    })

    test('tautan WhatsApp memakai wa.me tanpa "+" mentah', async ({ page }) => {
      const whatsapp = page.locator('a[href*="wa.me"]').first()
      await expect(whatsapp).toHaveAttribute('href', 'https://wa.me/628000000000')

      const href = await whatsapp.getAttribute('href')
      expect(href).not.toContain('+62')
      expect(href).not.toContain('wa.me/+')
    })

    test('tautan LinkedIn dan GitHub mengarah ke URL dari seed', async ({ page }) => {
      const linkedin = page.locator('a[href="https://www.linkedin.com/in/contoh"]').first()
      const github = page.locator('a[href="https://github.com/contoh"]').first()

      await expect(linkedin).toBeVisible()
      await expect(github).toBeVisible()
    })
  })
}
