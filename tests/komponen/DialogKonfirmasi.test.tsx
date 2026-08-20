import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogKonfirmasi } from '@/components/admin/DialogKonfirmasi'

/**
 * Dialog konfirmasi adalah pengaman, dan pengaman harus diuji pada jalur
 * GAGALNYA — bukan hanya "tombolnya bisa diklik".
 *
 * Yang dijaga di sini semuanya bisa rusak tanpa terlihat di layar:
 * fokus awal yang salah membuat satu ketukan Enter menyelesaikan aksi yang
 * sedang dikonfirmasi; Escape atau klik latar yang tidak membatalkan mengurung
 * pengguna; dan aksi yang berjalan tanpa ada yang menekan tombolnya adalah
 * kebalikan dari tujuan komponen ini.
 */
const PROPS = {
  judul: 'Hapus entri ini?',
  keterangan: 'Entri dan seluruh isinya dihapus permanen.',
  labelAksi: 'Hapus Permanen',
  jenis: 'bahaya' as const,
}

describe('DialogKonfirmasi', () => {
  it('mengumumkan diri sebagai dialog modal, dengan judul dan akibatnya terbaca', () => {
    render(<DialogKonfirmasi {...PROPS} onKonfirmasi={vi.fn()} onBatal={vi.fn()} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Judul DAN keterangan harus terhubung ke dialognya — pembaca layar yang
    // hanya mengumumkan judul tidak menyampaikan akibat tindakannya.
    expect(dialog).toHaveAccessibleName('Hapus entri ini?')
    expect(dialog).toHaveAccessibleDescription(/dihapus permanen/i)
  })

  it('fokus awal ada di Batal, BUKAN di tombol aksi', () => {
    render(<DialogKonfirmasi {...PROPS} onKonfirmasi={vi.fn()} onBatal={vi.fn()} />)

    // Ini asersi keamanan, bukan kenyamanan. Kalau fokus mendarat di tombol
    // merah, satu Enter refleks menuntaskan penghapusan permanen.
    expect(screen.getByRole('button', { name: 'Batal' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Hapus Permanen' })).not.toHaveFocus()
  })

  it('tidak menjalankan aksi apa pun sampai tombol aksinya ditekan', async () => {
    const onKonfirmasi = vi.fn()
    render(<DialogKonfirmasi {...PROPS} onKonfirmasi={onKonfirmasi} onBatal={vi.fn()} />)

    expect(onKonfirmasi).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Hapus Permanen' }))
    expect(onKonfirmasi).toHaveBeenCalledTimes(1)
  })

  it('Batal membatalkan, dan TIDAK menjalankan aksinya', async () => {
    const onKonfirmasi = vi.fn()
    const onBatal = vi.fn()
    render(<DialogKonfirmasi {...PROPS} onKonfirmasi={onKonfirmasi} onBatal={onBatal} />)

    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onBatal).toHaveBeenCalledTimes(1)
    expect(onKonfirmasi).not.toHaveBeenCalled()
  })

  it('Escape membatalkan', async () => {
    const onKonfirmasi = vi.fn()
    const onBatal = vi.fn()
    render(<DialogKonfirmasi {...PROPS} onKonfirmasi={onKonfirmasi} onBatal={onBatal} />)

    await userEvent.keyboard('{Escape}')
    expect(onBatal).toHaveBeenCalledTimes(1)
    expect(onKonfirmasi).not.toHaveBeenCalled()
  })

  it('klik latar membatalkan, tapi klik di dalam panel TIDAK', async () => {
    const onBatal = vi.fn()
    const { container } = render(
      <DialogKonfirmasi {...PROPS} onKonfirmasi={vi.fn()} onBatal={onBatal} />,
    )

    // Klik di dalam panel tidak boleh menembus ke latar. Tanpa
    // `stopPropagation`, memilih teks keterangan pun menutup dialognya.
    await userEvent.click(screen.getByRole('dialog'))
    expect(onBatal).not.toHaveBeenCalled()

    const latar = container.firstElementChild as HTMLElement
    await userEvent.click(latar)
    expect(onBatal).toHaveBeenCalledTimes(1)
  })

  it('saat sedang diproses, kedua tombol dinonaktifkan', () => {
    render(
      <DialogKonfirmasi {...PROPS} sedangProses onKonfirmasi={vi.fn()} onBatal={vi.fn()} />,
    )

    // Mencegah pengiriman ganda: aksi yang tidak idempoten (mis. hapus) bisa
    // menghasilkan galat membingungkan kalau dipanggil dua kali.
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Memproses/ })).toBeDisabled()
  })

  it('jenis "bahaya" dan "biasa" menghasilkan tombol yang berbeda', () => {
    const { container: bahaya } = render(
      <DialogKonfirmasi {...PROPS} onKonfirmasi={vi.fn()} onBatal={vi.fn()} />,
    )
    const kelasBahaya =
      bahaya.querySelector('[role="dialog"] button:last-of-type')?.className ?? ''

    const { container: biasa } = render(
      <DialogKonfirmasi
        judul="Terbitkan?"
        keterangan="Akan tampil publik."
        labelAksi="Terbitkan"
        jenis="biasa"
        onKonfirmasi={vi.fn()}
        onBatal={vi.fn()}
      />,
    )
    const kelasBiasa = biasa.querySelector('[role="dialog"] button:last-of-type')?.className ?? ''

    // Aksi merusak tidak boleh terlihat sama dengan aksi biasa.
    expect(kelasBahaya).not.toBe(kelasBiasa)
    expect(kelasBahaya).toContain('critical')
  })
})
