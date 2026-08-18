import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldBerkas } from '@/components/admin/field/FieldBerkas'
import type { DefinisiField } from '@/lib/admin/skema/tipe'

// Bentuk mirip site_settings.resume_pdf: field 'berkas' wajib, nilainya
// string BIASA (object path), bukan objek (D19/D20).
const definisi: DefinisiField = {
  nama: 'resume_pdf',
  label: 'Berkas CV',
  jenis: 'berkas',
  wajib: true,
}

function buatBerkasPdf(nama = 'cv.pdf', ukuranByte = 2048): File {
  return new File([new Uint8Array(ukuranByte)], nama, { type: 'application/pdf' })
}

describe('FieldBerkas — kasus 5: onChange menerima string path, bukan objek', () => {
  it('memanggil onChange dengan string path setelah unggah berhasil', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const unggah = vi.fn().mockResolvedValue({ path: 'unggahan/cv-a.pdf' })

    render(
      <FieldBerkas
        definisi={definisi}
        jalur={['resume_pdf']}
        nilai=""
        onChange={onChange}
        unggah={unggah}
      />,
    )

    await user.upload(screen.getByLabelText('Berkas CV', { exact: false }), buatBerkasPdf())

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange).toHaveBeenCalledWith(['resume_pdf'], 'unggahan/cv-a.pdf')
    // Bukti eksplisit bentuknya string BIASA, bukan objek `{ path }`.
    expect(typeof onChange.mock.calls[0]?.[1]).toBe('string')
  })
})

describe('FieldBerkas — kasus 6: nama dan ukuran berkas tampil', () => {
  it('menampilkan nama berkas dan ukurannya setelah unggah berhasil', async () => {
    const user = userEvent.setup()
    const unggah = vi.fn().mockResolvedValue({ path: 'unggahan/cv-besar.pdf' })

    render(
      <FieldBerkas
        definisi={definisi}
        jalur={['resume_pdf']}
        nilai=""
        onChange={vi.fn()}
        unggah={unggah}
      />,
    )

    await user.upload(screen.getByLabelText('Berkas CV', { exact: false }), buatBerkasPdf('cv-besar.pdf', 1536))

    expect(await screen.findByText(/cv-besar\.pdf/)).toBeInTheDocument()
    expect(screen.getByText(/1\.5 KB/)).toBeInTheDocument()
  })
})

describe('FieldBerkas — kasus 7: unggah gagal tidak memanggil onChange', () => {
  it('menampilkan pesan error dan mempertahankan path lama tanpa memanggil onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const unggah = vi.fn().mockResolvedValue({ error: 'Jenis berkas "text/plain" tidak didukung.' })

    render(
      <FieldBerkas
        definisi={definisi}
        jalur={['resume_pdf']}
        nilai="unggahan/cv-lama.pdf"
        onChange={onChange}
        unggah={unggah}
      />,
    )

    await user.upload(screen.getByLabelText('Berkas CV', { exact: false }), buatBerkasPdf('bukan-pdf.txt', 100))

    expect(await screen.findByRole('alert')).toHaveTextContent('Jenis berkas "text/plain" tidak didukung.')
    expect(onChange).not.toHaveBeenCalled()
    // Path lama (dari sesi sebelumnya) tetap ditampilkan — bukti nilai lama
    // tidak tertimpa oleh unggahan yang gagal.
    expect(screen.getByText('unggahan/cv-lama.pdf')).toBeInTheDocument()
  })
})
