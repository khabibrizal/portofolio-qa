import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  LabRunner,
  type LabRunnerLabels,
  type LabScenarioResolved,
} from '@/components/sections/LabRunner'

/**
 * Perpindahan tab Automation Lab.
 *
 * DULU INI HANYA DIUJI E2E, dan uji itu bersandar pada kebetulan: seed memuat
 * dua skenario published, jadi ada dua tab untuk diklik. Ketika skenario kedua
 * (contoh k6, lengkap dengan URL report example.com) tidak lagi diterbitkan,
 * tabnya hilang — dan `getByRole('tab', { name: 'k6' }).click()` menggantung 30
 * detik lalu mati dengan "locator.click: Test timeout". Pesan itu menyesatkan:
 * terbaca seperti elemen yang tertutup sesuatu, padahal elemennya tiada.
 *
 * Uji E2E-nya kini melewati diri sendiri bila skenario published kurang dari
 * dua — benar, tapi berarti perilaku perpindahan tab tidak teruji sama sekali
 * selama pemilik baru punya satu skenario. Hijau yang kosong.
 *
 * Di sini fixture-nya dituliskan, jadi cakupannya tidak bergantung pada berapa
 * skenario yang kebetulan diterbitkan.
 */
const LABEL: LabRunnerLabels = {
  tombolJalankan: 'Jalankan Test',
  tombolJalankanLagi: 'Jalankan Lagi',
  progresPrefix: 'Menjalankan',
  totalTest: 'Total Test',
  passed: 'Passed',
  failed: 'Failed',
  durasi: 'Durasi',
  lihatReport: 'Lihat Report Lengkap',
  lihatSumber: 'Lihat di GitHub',
  tanpaLangkah: 'Skenario ini belum memiliki langkah.',
}

function skenario(n: number, nama: string): LabScenarioResolved {
  return {
    id: `s-${n}`,
    frameworkName: nama,
    scenarioTitle: `Judul Skenario ${n}`,
    scenarioDescription: `Deskripsi skenario ${n}.`,
    tags: [`tag-${n}`],
    steps: [{ label: `Langkah ${n}`, durationMs: 10 }],
    resultSummary: { total: 1, passed: 1, failed: 0, duration: `${n}.0s` },
    fullReportUrl: n === 2 ? 'https://contoh.test/report' : null,
    kode: n === 1 ? 'Scenario: contoh' : null,
    kodeBahasa: n === 1 ? 'Gherkin' : null,
    repoUrl: n === 1 ? 'https://contoh.test/repo' : null,
  }
}

const DUA = [skenario(1, 'Playwright'), skenario(2, 'k6')]

describe('LabRunner — perpindahan tab', () => {
  it('tab pertama aktif saat pertama dirender', () => {
    render(<LabRunner scenarios={DUA} labels={LABEL} />)

    expect(screen.getByRole('tab', { name: 'Playwright' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'k6' })).toHaveAttribute('aria-selected', 'false')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Judul Skenario 1')
  })

  it('mengklik tab lain menampilkan skenario lain, bukan skenario yang sama', async () => {
    const user = userEvent.setup()
    render(<LabRunner scenarios={DUA} labels={LABEL} />)

    await user.click(screen.getByRole('tab', { name: 'k6' }))

    expect(screen.getByRole('tab', { name: 'k6' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Playwright' })).toHaveAttribute(
      'aria-selected',
      'false',
    )

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('Judul Skenario 2')
    expect(panel).not.toHaveTextContent('Judul Skenario 1')
  })

  it('skenario yang baru dibuka tampil dalam keadaan idle, bukan mewarisi keadaan tab sebelumnya', async () => {
    const user = userEvent.setup()
    render(<LabRunner scenarios={DUA} labels={LABEL} />)

    // Mulai replay di tab pertama, lalu pindah sebelum selesai.
    await user.click(screen.getByRole('button', { name: LABEL.tombolJalankan }))
    await user.click(screen.getByRole('tab', { name: 'k6' }))

    expect(
      screen.getByRole('button', { name: LABEL.tombolJalankan }),
      'tab baru mewarisi keadaan "berjalan" dari tab yang ditinggalkan',
    ).toBeInTheDocument()
  })

  it('tautan sumber tampil tanpa perlu menjalankan replay lebih dulu', async () => {
    const user = userEvent.setup()
    render(<LabRunner scenarios={DUA} labels={LABEL} />)

    // Skenario 1 punya repoUrl. Tautannya harus ada SEBELUM tombol ditekan —
    // tautan ke kode sumber bukan hasil eksekusi.
    const sumber = screen.getByRole('link', { name: LABEL.lihatSumber })
    expect(sumber).toHaveAttribute('href', 'https://contoh.test/repo')

    // Tautan report BELUM ada: ia memang milik blok hasil.
    expect(screen.queryByRole('link', { name: LABEL.lihatReport })).toBeNull()

    // Skenario 2 tidak punya repoUrl, jadi tautan sumbernya tidak dirender.
    await user.click(screen.getByRole('tab', { name: 'k6' }))
    expect(screen.queryByRole('link', { name: LABEL.lihatSumber })).toBeNull()
  })

  it('cuplikan kode hanya dirender untuk skenario yang punya kode', async () => {
    const user = userEvent.setup()
    render(<LabRunner scenarios={DUA} labels={LABEL} />)

    expect(screen.getByRole('tabpanel')).toHaveTextContent('Scenario: contoh')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gherkin')

    await user.click(screen.getByRole('tab', { name: 'k6' }))
    expect(screen.getByRole('tabpanel')).not.toHaveTextContent('Scenario: contoh')
  })

  it('satu skenario saja tetap dirender, tanpa tab yang menggantung', () => {
    render(<LabRunner scenarios={[skenario(1, 'Playwright')]} labels={LABEL} />)

    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Judul Skenario 1')
  })
})
