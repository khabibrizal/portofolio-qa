import { expect, test } from '@playwright/test'

/**
 * Menutup U-4.
 *
 * Sebelum ini, cabang `<Image>` di About dan Testimonials tidak pernah
 * dieksekusi test mana pun: seed membiarkan `profile_photo` dan `photo`
 * bernilai null, sehingga cabangnya selalu dilewati. Kode yang tidak pernah
 * dijalankan bukan kode yang teruji.
 *
 * Yang diperiksa di sini sengaja lebih keras daripada "elemen <img> ada":
 *
 * 1. Permintaan gambarnya menjawab 200 dengan content-type gambar. Elemen
 *    <img> tetap ada di DOM sekalipun src-nya 404 — memeriksa keberadaannya
 *    saja akan hijau untuk gambar yang rusak.
 *
 * 2. `naturalWidth > 0`. Ini yang paling mengikat: nilainya baru terisi kalau
 *    peramban benar-benar berhasil MEN-DECODE berkasnya. Server yang menjawab
 *    200 dengan halaman error, atau berkas PNG cacat, tetap lolos pemeriksaan
 *    HTTP tapi jatuh di sini.
 */
const GAMBAR = [
  { nama: 'foto profil di section Tentang', bagian: '#tentang' },
  { nama: 'foto pemberi testimoni', bagian: '#testimoni' },
]

for (const { nama, bagian } of GAMBAR) {
  test(`${nama} benar-benar dimuat, bukan sekadar ada di DOM`, async ({ page, request }) => {
    await page.goto('/id')

    const img = page.locator(`${bagian} img`).first()
    await expect(img, `tidak ada <img> di ${bagian}`).toBeVisible()

    const src = await img.getAttribute('src')
    expect(src, `<img> di ${bagian} tanpa src`).toBeTruthy()

    const res = await request.get(src!)
    expect(res.status(), `gambar ${bagian} menjawab ${res.status()}`).toBe(200)
    expect(res.headers()['content-type'] ?? '').toContain('image/')

    // next/image memuat lazy, dan sebagian section ada jauh di bawah lipatan —
    // jadi gambarnya harus digulirkan ke viewport dulu. Tanpa ini pemeriksaan
    // naturalWidth berjalan sebelum peramban sempat mengunduh apa pun, dan
    // gambar yang sehat pun akan tampak gagal.
    await img.scrollIntoViewIfNeeded()

    await expect
      .poll(
        () => img.evaluate((el) => (el as HTMLImageElement).naturalWidth),
        { message: `gambar ${bagian} tidak berhasil di-decode peramban`, timeout: 10_000 },
      )
      .toBeGreaterThan(0)
  })
}

test('URL gambar dibangun dari object path, bukan disimpan penuh di database', async ({
  page,
}) => {
  await page.goto('/id')

  const src = await page.locator('#tentang img').first().getAttribute('src')

  // Keputusan D19: database menyimpan object path; URL publiknya dibangun
  // helper urlMedia(). Kalau suatu saat ada yang menyimpan URL penuh ke kolom
  // media, bentuk ini yang pertama berubah — dan pindah proyek Supabase
  // berubah dari mengganti satu konstanta jadi migrasi data.
  expect(src).toContain('/storage/v1/object/public/media/')
  expect(src).toContain('about/foto-profil.png')
})
