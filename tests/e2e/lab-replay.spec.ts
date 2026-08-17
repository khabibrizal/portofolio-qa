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
