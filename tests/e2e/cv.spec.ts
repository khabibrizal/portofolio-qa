import { expect, test } from '@playwright/test'

/**
 * CV di-generate dari database saat diminta, bukan diunggah sebagai berkas.
 *
 * Yang diperiksa sengaja lebih dari "menjawab 200": PDF rusak juga menjawab
 * 200. Yang mengikat adalah tanda tangan `%PDF-` di awal berkas dan ukuran
 * yang masuk akal — berkas nol byte atau halaman HTML error akan lolos
 * pemeriksaan status tapi jatuh di sini.
 */
for (const locale of ['id', 'en']) {
  test(`/${locale}/cv menghasilkan PDF yang sah`, async ({ request }) => {
    const res = await request.get(`/${locale}/cv`)

    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/pdf')
    expect(res.headers()['content-disposition'] ?? '').toContain('.pdf')

    const isi = await res.body()

    // Tanda tangan PDF. Tanpa ini, halaman error yang dikirim dengan
    // content-type PDF tetap akan lolos.
    expect(isi.subarray(0, 5).toString('latin1')).toBe('%PDF-')

    // Ambang bawah yang longgar tapi bermakna: PDF berisi struktur halaman,
    // font, dan teks tidak mungkin di bawah 1 KB.
    expect(isi.length, `PDF ${locale} hanya ${isi.length} byte`).toBeGreaterThan(1_000)
  })
}

test('bahasa yang tidak dikenal tidak menghasilkan PDF', async ({ request }) => {
  const res = await request.get('/jv/cv')
  expect(res.status()).toBe(404)
})

test('tombol Unduh CV mengikuti bahasa yang sedang dibaca', async ({ page }) => {
  // Tautannya disimpan sekali di database sebagai `/cv`; yang menentukan
  // bahasa adalah halaman tempat pembaca berada. Tanpa ini, pembaca versi
  // Inggris akan mengunduh CV berbahasa Indonesia.
  for (const locale of ['id', 'en']) {
    await page.goto(`/${locale}`)

    const tautan = page.locator(`main a[href$="/cv"]`).first()
    await expect(tautan).toHaveAttribute('href', `/${locale}/cv`)
  }
})
