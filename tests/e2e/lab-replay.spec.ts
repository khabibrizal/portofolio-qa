import { expect, test } from '@playwright/test'

// Replay Automation Lab punya jeda ratusan milidetik per langkah (850ms +
// 600ms di seed). Seluruh penantian di sini memakai expect yang retry
// otomatis — bukan waitForTimeout buta — supaya test tetap cepat saat report
// muncul lebih awal dan tetap tidak flaky saat CI lebih lambat dari lokal.
test.describe('Automation Lab — replay interaktif', () => {
  test('klik "Jalankan Test" memutar replay lalu menampilkan report sesuai seed', async ({
    page,
  }) => {
    await page.goto('/id')

    const panel = page.locator('#automation-lab').getByRole('tabpanel')
    // Dicari lewat role saja (bukan filter nama) karena label tombolnya
    // berubah dari "Jalankan Test" jadi "Jalankan Lagi" setelah replay selesai.
    const tombol = panel.getByRole('button')
    await expect(tombol).toHaveText('Jalankan Test')
    await tombol.click()

    // Durasi total langkah di seed adalah 850ms + 600ms; timeout diberi
    // ruang jauh lebih longgar untuk menampung overhead di CI.
    await expect(panel.getByText('4.1s')).toBeVisible({ timeout: 10_000 })

    const isiReport = await panel.innerText()
    expect(isiReport).toContain('Total Test')
    expect(isiReport).toContain('6')
    expect(isiReport).toContain('Passed')
    expect(isiReport).toContain('Failed')
    expect(isiReport).toContain('0')
    expect(isiReport).toContain('Durasi')
    expect(isiReport).toContain('4.1s')

    // Tombol berubah jadi "Jalankan Lagi" dan replay bisa diputar berulang.
    await expect(tombol).toHaveText('Jalankan Lagi')
    await tombol.click()
    await expect(panel.getByText('4.1s')).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Automation Lab — perpindahan tab', () => {
  test('berpindah tab menampilkan skenario lain, bukan skenario yang sama', async ({ page }) => {
    await page.goto('/id')

    const lab = page.locator('#automation-lab')
    const tabPlaywright = lab.getByRole('tab', { name: 'Playwright' })
    const tabK6 = lab.getByRole('tab', { name: 'k6' })

    await expect(tabPlaywright).toHaveAttribute('aria-selected', 'true')
    await expect(lab.getByRole('tabpanel')).toContainText('Login & Checkout End-to-End')

    await tabK6.click()
    await expect(tabK6).toHaveAttribute('aria-selected', 'true')
    await expect(tabPlaywright).toHaveAttribute('aria-selected', 'false')
    await expect(lab.getByRole('tabpanel')).toContainText('Uji Beban Endpoint Pencarian')
    await expect(lab.getByRole('tabpanel')).not.toContainText('Login & Checkout End-to-End')
  })

  test('tautan report lengkap hanya muncul pada skenario yang punya URL', async ({ page }) => {
    await page.goto('/id')

    const lab = page.locator('#automation-lab')
    const panel = lab.getByRole('tabpanel')

    // Skenario pertama di seed sengaja tidak punya full_report_url — cabang
    // penjaga null-nya harus benar-benar menyembunyikan tautannya.
    await panel.getByRole('button').click()
    await expect(panel.getByText('4.1s')).toBeVisible({ timeout: 10_000 })
    await expect(panel.getByRole('link')).toHaveCount(0)

    // Skenario kedua punya URL, jadi tautannya wajib ada setelah report muncul.
    await lab.getByRole('tab', { name: 'k6' }).click()
    await panel.getByRole('button').click()
    await expect(panel.getByText('1.4s')).toBeVisible({ timeout: 10_000 })
    await expect(panel.getByRole('link')).toHaveAttribute(
      'href',
      'https://example.com/laporan/uji-beban-pencarian',
    )
  })

  test('berpindah tab di tengah replay tidak meninggalkan indikator yang membeku', async ({
    page,
  }) => {
    const errorKonsol: string[] = []
    page.on('pageerror', (e) => errorKonsol.push(e.message))

    await page.goto('/id')

    const lab = page.locator('#automation-lab')
    const panel = lab.getByRole('tabpanel')

    // Mulai replay lalu pindah tab SEBELUM selesai (total langkah 850+600ms).
    await panel.getByRole('button').click()
    await lab.getByRole('tab', { name: 'k6' }).click()

    // Skenario kedua harus tampil dalam keadaan idle — bukan mewarisi keadaan
    // "berjalan" dari skenario yang ditinggalkan.
    await expect(panel.getByRole('button')).toHaveText('Jalankan Test')

    // Penantian buta yang DISENGAJA, dan satu-satunya di suite ini.
    // Yang dibuktikan adalah KETIADAAN kejadian: kalau timer skenario pertama
    // tidak dibersihkan saat tab berganti, ia terus menembak di latar dan
    // menuntaskan replay yang sudah ditinggalkan. Memeriksa keadaan segera
    // setelah pindah tab tidak bisa menangkap itu — jendela timer basinya
    // belum terlewati. Jadi kita lewati dulu jendela itu (850+600ms), baru
    // periksa. Versi pertama test ini lulus meski pembersihan timer dihapus;
    // dibuktikan lewat mutasi.
    await page.waitForTimeout(2_500)

    await lab.getByRole('tab', { name: 'Playwright' }).click()

    // Skenario pertama harus tetap idle: tidak pernah lanjut sendiri, dan
    // report-nya tidak boleh muncul tanpa ada yang menekan tombolnya.
    await expect(panel.getByRole('button')).toHaveText('Jalankan Test')
    await expect(panel.getByText('4.1s')).toHaveCount(0)

    // Timer yang menembak setelah tab berganti akan muncul sebagai error
    // runtime; tidak boleh ada satu pun.
    expect(errorKonsol, `error runtime muncul: ${errorKonsol.join('; ')}`).toEqual([])
  })
})

test.describe('Automation Lab — aksesibilitas dasar', () => {
  test('tab Lab bisa dijangkau via Tab dan diaktifkan via Enter/Space, bukan hanya klik mouse', async ({
    page,
  }) => {
    await page.goto('/id')

    const tab = page.getByRole('tab', { name: 'Playwright' })

    // Susuri urutan fokus sungguhan lewat tombol Tab sampai mengenai tab Lab
    // — bukan locator.focus(), yang melompati urutan tabindex asli halaman.
    let terjangkau = false
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab')
      terjangkau = await tab.evaluate((el) => el === document.activeElement)
      if (terjangkau) break
    }
    expect(terjangkau, 'tab Lab tidak pernah menerima fokus lewat urutan Tab').toBe(true)

    // Enter mengaktifkan tab yang sedang fokus.
    await page.keyboard.press('Enter')
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toBeVisible()

    // Fokus tetap di tombol (perilaku native <button>) — Space juga
    // mengaktifkan, tanpa error dan tab tetap terpilih.
    await expect(tab).toBeFocused()
    await page.keyboard.press('Space')
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel')).toBeVisible()
  })
})
