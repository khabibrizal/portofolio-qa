import { expect, test } from '@playwright/test'

// Memverifikasi bahwa nilai dari seed database benar-benar tampil di /id —
// bukan sekadar elemen ada, tapi teksnya cocok dengan supabase/seed.sql.
test.describe('/id — konten dari database', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id')
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

  test('About menampilkan badge highlight dan about_richtext berbahasa Indonesia', async ({
    page,
  }) => {
    const isi = await page.locator('body').innerText()

    expect(isi).toContain('Manual & Automation')
    expect(isi).toContain('Quality bukan cuma mencari bug')
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
    expect(isi).toContain('Platform Properti B2C')
    expect(isi).toContain('3 hari → 4 jam')
    expect(isi).toContain('0')
    for (const tool of ['Playwright', 'k6']) {
      expect(isi).toContain(tool)
    }
  })

  test('AutomationLab menampilkan framework dan judul skenario berbahasa Indonesia', async ({
    page,
  }) => {
    const isi = await page.locator('#automation-lab').innerText()

    expect(isi).toContain('Playwright')
    expect(isi).toContain('Login & Checkout End-to-End')
  })

  test('Timeline menampilkan perusahaan, peran, dan periode berjalan', async ({ page }) => {
    const isi = await page.locator('#pengalaman').innerText()

    expect(isi).toContain('Platform Properti B2C')
    expect(isi).toContain('QA Engineer')
    expect(isi).toContain('Sekarang')
  })

  test('Certifications menampilkan sertifikasi dan edukasi published', async ({ page }) => {
    const isi = await page.locator('#sertifikasi').innerText()

    expect(isi).toContain('ISTQB Foundation Level')
    expect(isi).toContain('S1 Teknik Informatika')
  })

  test('Testimonials menampilkan kutipan dan nama pemberi testimoni', async ({ page }) => {
    const isi = await page.locator('#testimoni').innerText()

    expect(isi).toContain('Konsisten menemukan edge case')
    expect(isi).toContain('Rekan Kerja')
  })

  test('FinalCta menampilkan headline ajakan kontak', async ({ page }) => {
    const isi = await page.locator('#kontak').innerText()

    expect(isi).toContain('Siap membantu tim kamu rilis')
  })
})
