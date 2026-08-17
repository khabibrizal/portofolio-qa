import { expect, test } from '@playwright/test'

/**
 * Seed sengaja memuat satu sertifikat DENGAN credential_url dan satu TANPA.
 * Tanpa keduanya hadir bersamaan, salah satu cabang di Certifications.tsx
 * ("kartu dibungkus tautan" versus "kartu polos") tidak akan pernah dieksekusi
 * test mana pun — hijau yang tidak membuktikan apa-apa.
 */
test.describe('Sertifikasi — cabang credential_url', () => {
  test('sertifikat dengan credential_url dibungkus tautan yang benar', async ({ page }) => {
    await page.goto('/id')

    const tautan = page
      .locator('#sertifikasi')
      .getByRole('link', { name: /ISTQB Foundation Level/ })

    await expect(tautan).toHaveCount(1)
    await expect(tautan).toHaveAttribute('href', 'https://example.com/kredensial/istqb-fl')
  })

  test('sertifikat tanpa credential_url tidak dibungkus tautan', async ({ page }) => {
    await page.goto('/id')

    const bagian = page.locator('#sertifikasi')

    // Kartunya harus tetap tampil...
    await expect(bagian).toContainText('Certified Tester Agile')

    // ...tapi tidak boleh ada tautan yang memuat namanya.
    await expect(
      bagian.getByRole('link', { name: /Certified Tester Agile/ }),
      'kartu tanpa credential_url seharusnya tidak jadi tautan',
    ).toHaveCount(0)
  })

  test('edukasi tampil bersama sertifikasi dalam satu bagian', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('#sertifikasi')).toContainText('B.Sc. Informatics')
  })
})
