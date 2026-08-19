import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { about, koleksi } from '../helpers/konten'

/**
 * Menutup U-4.
 *
 * Sebelum ini, cabang `<Image>` di About dan Testimonials tidak pernah
 * dieksekusi test mana pun: seed membiarkan `profile_photo` dan `photo`
 * bernilai null, sehingga cabangnya selalu dilewati. Kode yang tidak pernah
 * dijalankan bukan kode yang teruji.
 *
 * Yang diperiksa sengaja lebih keras daripada "elemen <img> ada":
 *
 * 1. Permintaan gambarnya menjawab 200 dengan content-type gambar. Elemen
 *    <img> tetap ada di DOM sekalipun src-nya 404 — memeriksa keberadaannya
 *    saja akan hijau untuk gambar yang rusak.
 *
 * 2. `naturalWidth > 0`. Ini yang paling mengikat: nilainya baru terisi kalau
 *    peramban benar-benar berhasil MEN-DECODE berkasnya. Server yang menjawab
 *    200 dengan halaman error, atau berkas PNG cacat, tetap lolos pemeriksaan
 *    HTTP tapi jatuh di sini.
 *
 * KEHADIRAN GAMBARNYA DITENTUKAN DATABASE, bukan diasumsikan. Versi sebelumnya
 * menuntut ada <img> di #testimoni; ketika seluruh testimoni contoh tidak lagi
 * diterbitkan — keadaan yang benar, karena testimoni itu karangan — test gagal
 * dengan "tidak ada <img>". Yang dilaporkannya bukan cacat aplikasi, melainkan
 * ketiadaan data. Sekarang section tanpa data dilewati bersih.
 */
async function periksaGambar(page: Page, request: APIRequestContext, bagian: string) {
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
    .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth), {
      message: `gambar ${bagian} tidak berhasil di-decode peramban`,
      timeout: 10_000,
    })
    .toBeGreaterThan(0)
}

type AboutFoto = { profile_photo?: { path?: string } | null } | null

test('foto profil di section Tentang benar-benar dimuat, bukan sekadar ada di DOM', async ({
  page,
  request,
}) => {
  const a = (await about(request)) as AboutFoto
  test.skip(!a?.profile_photo?.path, 'about.profile_photo belum diisi')

  await page.goto('/id')
  await periksaGambar(page, request, '#tentang')
})

test('foto pemberi testimoni benar-benar dimuat, bukan sekadar ada di DOM', async ({
  page,
  request,
}) => {
  const testimoni = await koleksi<{ photo: { path?: string } | null }>(
    request,
    'testimonials',
    'photo,sort_order',
  )
  test.skip(
    !testimoni.some((t) => t.photo?.path),
    'belum ada testimoni published yang punya foto',
  )

  await page.goto('/id')
  await periksaGambar(page, request, '#testimoni')
})

test('URL gambar dibangun dari object path, bukan disimpan penuh di database', async ({
  page,
  request,
}) => {
  const a = (await about(request)) as AboutFoto
  const path = a?.profile_photo?.path
  test.skip(!path, 'about.profile_photo belum diisi')

  await page.goto('/id')
  const src = await page.locator('#tentang img').first().getAttribute('src')
  expect(src, '<img> di #tentang tanpa src').toBeTruthy()

  // Gambarnya kini dilewatkan pengoptimal Next, jadi src-nya berbentuk
  // `/_next/image?url=<URL asli ter-encode>&w=...`. URL aslinya diambil dari
  // parameter itu — mengasersi src mentah akan gagal hanya karena tanda "/"
  // berubah jadi "%2F", dan kegagalan seperti itu tidak menandai apa pun.
  const asal = src!.startsWith('/_next/image')
    ? new URL(src!, 'http://localhost').searchParams.get('url')
    : src
  expect(asal, 'parameter url pada /_next/image kosong').toBeTruthy()

  // Keputusan D19: database menyimpan object path; URL publiknya dibangun
  // helper urlMedia(). Kalau suatu saat ada yang menyimpan URL penuh ke kolom
  // media, bentuk ini yang pertama berubah — dan pindah proyek Supabase
  // berubah dari mengganti satu konstanta jadi migrasi data.
  //
  // Path-nya DIBACA DARI DATABASE, bukan dituliskan di sini. Versi sebelumnya
  // mengunci 'about/foto-profil.png' dari seed, lalu gagal ketika pemiliknya
  // mengunggah fotonya sendiri lewat /admin — padahal itu justru bukti fitur
  // unggahnya bekerja.
  expect(asal!).toContain('/storage/v1/object/public/media/')
  expect(asal!).toContain(path!)

  // Dan yang tersimpan di database memang PATH, bukan URL penuh.
  expect(path!, 'kolom media menyimpan URL penuh, bukan object path').not.toContain('http')
})
