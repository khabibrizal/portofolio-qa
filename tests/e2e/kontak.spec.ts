import { expect, test } from '@playwright/test'
import { settings } from '../helpers/konten'

/**
 * Tautan kontak: skema mailto, nomor WhatsApp yang wajib bersih dari
 * "+"/spasi/hubung, dan URL sosial.
 *
 * Nilai yang diharapkan DIBACA DARI DATABASE, bukan dituliskan di sini.
 * Versi sebelumnya mengunci nilai seed (`mailto:kontak@contoh.dev`,
 * `wa.me/628000000000`, `github.com/contoh`) sehingga ketiganya gagal begitu
 * pemiliknya mengisi kontak yang sebenarnya — padahal aplikasinya berperilaku
 * persis seperti seharusnya.
 *
 * Yang tetap dituliskan sebagai aturan adalah BENTUKNYA: `mailto:` sebagai
 * skema, `wa.me/` tanpa "+", dan href yang sama dengan nilai di database. Itu
 * bagian yang memang bisa salah, dan tetap bisa salah apa pun isinya.
 */
for (const locale of ['id', 'en']) {
  test.describe(`/${locale} — tautan kontak`, () => {
    test('tautan email memakai skema mailto: dan alamat dari database', async ({
      page,
      request,
    }) => {
      const s = await settings(request)
      await page.goto(`/${locale}`)

      const email = page.locator('a[href^="mailto:"]').first()
      await expect(email).toHaveAttribute('href', `mailto:${s.contact_email}`)
    })

    test('tautan WhatsApp memakai wa.me dan nomor tanpa "+" mentah', async ({ page, request }) => {
      const s = await settings(request)
      test.skip(!s.whatsapp_number, 'nomor WhatsApp belum diisi di site_settings')

      await page.goto(`/${locale}`)
      const whatsapp = page.locator('a[href*="wa.me"]').first()

      // Nomor di database boleh ditulis manusiawi ("+62 822-3368-4933");
      // yang WAJIB adalah versi di href sudah dibersihkan.
      const bersih = s.whatsapp_number!.replace(/[^0-9]/g, '')
      await expect(whatsapp).toHaveAttribute('href', `https://wa.me/${bersih}`)

      const href = await whatsapp.getAttribute('href')
      expect(href).not.toContain('+')
      expect(href).not.toContain(' ')
      expect(href).not.toContain('-')
    })

    test('tautan LinkedIn dan GitHub memakai URL dari database', async ({ page, request }) => {
      const s = await settings(request)
      await page.goto(`/${locale}`)

      for (const url of [s.linkedin_url, s.github_url]) {
        if (!url) continue
        await expect(
          page.locator(`a[href="${url}"]`).first(),
          `tautan ke ${url} tidak ditemukan di halaman`,
        ).toBeVisible()
      }
    })
  })
}
