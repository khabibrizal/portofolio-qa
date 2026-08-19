import { expect, test, type APIRequestContext } from '@playwright/test'
import { koleksi, type Dwibahasa } from '../helpers/konten'

/**
 * Angka report (durasi, total, jumlah tautan) DIBACA DARI DATABASE.
 *
 * Versi sebelumnya mengunci nilai seed — '4.1s', total '6', '1.4s', dan
 * "skenario pertama sengaja tidak punya full_report_url". Ketiganya berhenti
 * benar begitu skenario Lab diisi data run yang sungguhan: durasinya berubah,
 * totalnya berubah, dan skenario pertama justru MEMILIKI tautan report. Test
 * lalu melaporkan kegagalan atas perubahan konten, bukan atas cacat aplikasi.
 */
type Skenario = {
  framework_name: string
  scenario_title: Dwibahasa
  result_summary: { total: number; passed: number; failed: number; duration: string } | null
  full_report_url: string | null
  repo_url: string | null
  kode: string | null
}

function skenarioLab(request: APIRequestContext) {
  return koleksi<Skenario>(
    request,
    'lab_scenarios',
    'framework_name,scenario_title,result_summary,full_report_url,repo_url,kode,sort_order',
  )
}

// Replay Automation Lab punya jeda ratusan milidetik per langkah (850ms +
// 600ms di seed). Seluruh penantian di sini memakai expect yang retry
// otomatis — bukan waitForTimeout buta — supaya test tetap cepat saat report
// muncul lebih awal dan tetap tidak flaky saat CI lebih lambat dari lokal.
test.describe('Automation Lab — replay interaktif', () => {
  test('klik "Jalankan Test" memutar replay lalu menampilkan report sesuai database', async ({
    page,
    request,
  }) => {
    const lab = await skenarioLab(request)
    const pertama = lab[0]
    expect(pertama?.result_summary, 'skenario pertama tanpa result_summary').toBeTruthy()
    const durasi = pertama.result_summary!.duration

    await page.goto('/id')

    const panel = page.locator('#automation-lab').getByRole('tabpanel')
    // Dicari lewat role saja (bukan filter nama) karena label tombolnya
    // berubah dari "Jalankan Test" jadi "Jalankan Lagi" setelah replay selesai.
    const tombol = panel.getByRole('button')
    await expect(tombol).toHaveText('Jalankan Test')
    await tombol.click()

    // Timeout diberi ruang longgar: durasi replay adalah jumlah duration_ms
    // seluruh langkah, dan bisa berubah kapan pun datanya diperbarui.
    await expect(panel.getByText(durasi)).toBeVisible({ timeout: 15_000 })

    const isiReport = await panel.innerText()
    for (const label of ['Total Test', 'Passed', 'Failed', 'Durasi']) {
      expect(isiReport, `label report "${label}" tidak ada`).toContain(label)
    }
    expect(isiReport).toContain(String(pertama.result_summary!.total))
    expect(isiReport).toContain(String(pertama.result_summary!.failed))
    expect(isiReport).toContain(durasi)

    // Tombol berubah jadi "Jalankan Lagi" dan replay bisa diputar berulang.
    await expect(tombol).toHaveText('Jalankan Lagi')
    await tombol.click()
    await expect(panel.getByText(durasi)).toBeVisible({ timeout: 15_000 })
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

  test('tautan hanya muncul untuk URL yang benar-benar ada di database', async ({
    page,
    request,
  }) => {
    const lab = await skenarioLab(request)
    await page.goto('/id')

    const bagian = page.locator('#automation-lab')
    const panel = bagian.getByRole('tabpanel')

    // Diperiksa untuk SETIAP skenario, bukan hanya dua yang pertama: cabang
    // penjaga null-nya harus benar pada semuanya. Jumlah tautan yang diharapkan
    // diturunkan dari data — satu untuk full_report_url, satu untuk repo_url.
    for (const s of lab) {
      await bagian.getByRole('tab', { name: s.framework_name }).first().click()

      const tombol = panel.getByRole('button')
      if ((await tombol.count()) === 0) continue
      await tombol.click()

      if (s.result_summary) {
        await expect(panel.getByText(s.result_summary.duration)).toBeVisible({ timeout: 15_000 })
      }

      const diharapkan = [s.full_report_url, s.repo_url].filter(Boolean) as string[]
      await expect(
        panel.getByRole('link'),
        `${s.framework_name}: jumlah tautan tidak sesuai data`,
      ).toHaveCount(diharapkan.length)

      for (const url of diharapkan) {
        await expect(panel.locator(`a[href="${url}"]`)).toHaveCount(1)
      }
    }
  })

  test('berpindah tab di tengah replay tidak meninggalkan indikator yang membeku', async ({
    page,
    request,
  }) => {
    const skenario = await skenarioLab(request)
    const durasiPertama = skenario[0]?.result_summary?.duration ?? ''
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
    await expect(panel.getByText(durasiPertama)).toHaveCount(0)

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
