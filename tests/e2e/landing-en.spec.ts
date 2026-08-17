import { expect, test } from '@playwright/test'

// Padanan tests/e2e/landing-id.spec.ts untuk /en — nilai seed yang bilingual
// sengaja diisi identik di kolom id/en (lihat supabase/seed.sql), jadi
// assertion di sini sama; yang membedakan i18n sungguh bekerja diuji lewat
// about_richtext, satu-satunya field seed yang isinya sengaja berbeda.
test.describe('/en — konten dari database', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en')
  })

  test('Hero menampilkan role, intro, stats, dan konsol status', async ({ page }) => {
    const isi = await page.locator('body').innerText()

    expect(isi).toContain('QA Engineer — Manual & Automation Testing')

    for (const stat of ['4+', '1.200+', '350+', '70%']) {
      expect(isi).toContain(stat)
    }

    for (const cek of ['Manual Testing', 'Automation (Playwright)']) {
      expect(isi).toContain(cek)
    }
  })

  test('TrustStrip menampilkan daftar tools published', async ({ page }) => {
    const isi = await page.locator('body').innerText()

    for (const tool of ['Playwright', 'Postman', 'k6']) {
      expect(isi).toContain(tool)
    }
  })

  test('About menampilkan badge highlight dan about_richtext berbahasa Inggris', async ({
    page,
  }) => {
    const isi = await page.locator('body').innerText()

    expect(isi).toContain('Manual & Automation')
    expect(isi).toContain('Quality is not just finding bugs')
  })

  test('Coverage menampilkan kategori dan skill dengan persentasenya', async ({ page }) => {
    const isi = await page.locator('body').innerText()

    for (const kategori of ['Manual Testing', 'Automation Testing']) {
      expect(isi).toContain(kategori)
    }

    expect(isi).toContain('Test Case Design')
    expect(isi).toContain('90%')
  })

  test('CaseStudies menampilkan test_code, nama proyek, metrik, dan tag tool', async ({ page }) => {
    const isi = await page.locator('#studi-kasus').innerText()

    for (const kode of ['TC-001', 'TC-002']) {
      expect(isi).toContain(kode)
    }
    expect(isi).toContain('B2C Property Platform')
    expect(isi).toContain('3 hari → 4 jam')
    expect(isi).toContain('0')
    for (const tool of ['Playwright', 'k6']) {
      expect(isi).toContain(tool)
    }
  })

  test('AutomationLab menampilkan framework dan judul skenario berbahasa Inggris', async ({
    page,
  }) => {
    const isi = await page.locator('#automation-lab').innerText()

    expect(isi).toContain('Playwright')
    expect(isi).toContain('End-to-End Login & Checkout')
  })

  test('Timeline menampilkan perusahaan, peran, dan periode berjalan', async ({ page }) => {
    const isi = await page.locator('#pengalaman').innerText()

    expect(isi).toContain('B2C Property Platform')
    expect(isi).toContain('QA Engineer')
    expect(isi).toContain('Present')
  })

  test('Certifications menampilkan sertifikasi dan edukasi published', async ({ page }) => {
    const isi = await page.locator('#sertifikasi').innerText()

    expect(isi).toContain('ISTQB Foundation Level')
    expect(isi).toContain('B.Sc. Informatics')
  })

  test('Testimonials menampilkan kutipan dan nama pemberi testimoni', async ({ page }) => {
    const isi = await page.locator('#testimoni').innerText()

    expect(isi).toContain('Consistently finds edge cases')
    expect(isi).toContain('Rekan Kerja')
  })

  test('FinalCta menampilkan headline ajakan kontak', async ({ page }) => {
    const isi = await page.locator('#kontak').innerText()

    expect(isi).toContain('Ready to help your team ship')
  })
})
