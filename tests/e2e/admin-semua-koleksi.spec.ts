import { expect, test } from '@playwright/test'

/**
 * Membuka SETIAP koleksi di admin — daftar entri dan form entri baru.
 *
 * Skema koleksi adalah berkas data, jadi typecheck tidak menangkap bentuk
 * field yang salah: jenis yang tak dikenal, `anak` yang lupa diisi untuk
 * repeater/grup, atau nama kolom yang tak ada di tabel baru terlihat saat
 * form-nya benar-benar dirender. Sebelum test ini, tiga koleksi terakhir
 * (case_studies, lab_scenarios, experiences) belum pernah dibuka sekali pun.
 *
 * Sengaja tidak menyimpan apa pun — ini database produksi. Yang dibuktikan
 * hanya bahwa setiap koleksi bisa dibuka tanpa error.
 */
const KOLEKSI = [
  { slug: 'site-settings', label: 'Pengaturan Situs', singleton: true },
  { slug: 'hero', label: 'Hero', singleton: true },
  { slug: 'about', label: 'Tentang', singleton: true },
  { slug: 'tools', label: 'Tools', singleton: false },
  { slug: 'skill-categories', label: 'Kategori Keahlian', singleton: false },
  { slug: 'case-studies', label: 'Studi Kasus', singleton: false },
  { slug: 'lab-scenarios', label: 'Automation Lab', singleton: false },
  { slug: 'experiences', label: 'Pengalaman Kerja', singleton: false },
  { slug: 'certifications', label: 'Sertifikasi', singleton: false },
  { slug: 'education', label: 'Edukasi', singleton: false },
  { slug: 'testimonials', label: 'Testimoni', singleton: false },
] as const

const EMAIL = process.env.ADMIN_EMAIL
const SANDI = process.env.ADMIN_PASSWORD

test.describe('Setiap koleksi bisa dibuka di admin', () => {
  test.skip(
    !EMAIL || !SANDI,
    'ADMIN_EMAIL / ADMIN_PASSWORD tidak tersedia — test siklus admin dilewati',
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(EMAIL!)
    await page.getByLabel('Kata sandi').fill(SANDI!)
    await page.getByRole('button', { name: 'Masuk' }).click()
    await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 })
  })

  for (const { slug, singleton } of KOLEKSI) {
    test(`${slug}: halaman utamanya terbuka tanpa error`, async ({ page }) => {
      const res = await page.goto(`/admin/${slug}`)

      // Singleton dialihkan langsung ke form-nya (D21), jadi status akhirnya
      // tetap 200 — yang penting bukan 404 maupun 500.
      expect(res?.status(), `/admin/${slug} menjawab ${res?.status()}`).toBeLessThan(400)

      // Dilingkupi ke <main>, BUKAN <body>. textContent ikut membaca isi
      // <script>, dan payload RSC Next.js menyertakan template 404
      // ("This page could not be found.") sebagai fallback di SETIAP halaman —
      // jadi memeriksa body akan selalu gagal, bahkan untuk halaman yang sehat.
      const isi = (await page.locator('main').textContent()) ?? ''
      expect(isi).not.toContain('Application error')
      expect(isi).not.toContain('This page could not be found')

      // Form singleton harus punya tombol simpan; daftar koleksi harus punya
      // tautan tambah entri.
      if (singleton) {
        await expect(page.getByRole('button', { name: /Simpan/i }).first()).toBeVisible()
      } else {
        await expect(page.getByRole('link', { name: /Tambah/i }).first()).toBeVisible()
      }
    })
  }

  for (const { slug } of KOLEKSI.filter((k) => !k.singleton)) {
    test(`${slug}: form entri baru dirender lengkap`, async ({ page }) => {
      const res = await page.goto(`/admin/${slug}/baru`)
      expect(res?.status(), `form ${slug} menjawab ${res?.status()}`).toBeLessThan(400)

      const isi = (await page.locator('main').textContent()) ?? ''
      expect(isi).not.toContain('Application error')

      // Minimal satu kontrol input hadir — form kosong berarti skemanya tidak
      // terbaca sama sekali.
      const kontrol = page.locator('main input, main textarea, main select')
      expect(await kontrol.count(), `form ${slug} tidak punya satu pun input`).toBeGreaterThan(0)

      await expect(page.getByRole('button', { name: /Simpan/i }).first()).toBeVisible()
    })
  }
})
