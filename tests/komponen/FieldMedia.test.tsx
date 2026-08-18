import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldMedia, type NilaiMedia } from '@/components/admin/field/FieldMedia'
import { buatSkemaKoleksi, petaErrorDariZod } from '@/lib/admin/skema/ke-zod'
import { tulisNilai, type Jalur } from '@/lib/admin/nilai'
import type { DefinisiField, DefinisiKoleksi } from '@/lib/admin/skema/tipe'

// Bentuk mirip about.profile_photo: field 'media' wajib.
const definisi: DefinisiField = {
  nama: 'profile_photo',
  label: 'Foto Profil',
  jenis: 'media',
  wajib: true,
}

// Koleksi minimal berisi HANYA field di atas — dipakai kasus 4 supaya error
// yang dihasilkan Zod betul-betul lewat `buatSkemaKoleksi` (jalur error
// realistis berawalan nama field, persis yang dikonsumsi `FormSkema` di
// produksi), bukan cuma `buatSkemaField` telanjang yang jalurnya tidak
// diawali nama field.
const koleksiUji: DefinisiKoleksi = {
  slug: 'uji',
  tabel: 'uji',
  label: 'Uji',
  labelTunggal: 'Uji',
  kolomJudul: 'profile_photo',
  field: [definisi],
}

const nilaiKosong: NilaiMedia = { path: '', alt: { id: '', en: '' } }

function buatBerkasGambar(nama = 'foto.jpg', tipe = 'image/jpeg'): File {
  return new File(['isi-palsu'], nama, { type: tipe })
}

/**
 * Pembungkus stateful — persis pola FieldGrup.test.tsx/FieldTerlokalisasi.test.tsx:
 * FieldMedia sendiri tidak menyimpan nilai, jadi untuk menguji "mengubah satu
 * bahasa alt tidak menghapus bahasa lain" perlu induk yang benar-benar
 * menyimpan nilai lewat `onChange`, sama seperti `FormSkema` di produksi.
 * `jalur.slice(1)` membuang nama field media itu sendiri karena state lokal
 * di sini HANYA berisi isi `NilaiMedia` (bukan objek koleksi penuh).
 */
function Pembungkus({ nilaiAwal }: { nilaiAwal: NilaiMedia }) {
  const [nilai, setNilai] = useState<NilaiMedia>(nilaiAwal)
  return (
    <FieldMedia
      definisi={definisi}
      jalur={['profile_photo']}
      nilai={nilai}
      errors={{}}
      onChange={(jalur: Jalur, nilaiBaru: unknown) =>
        setNilai((sebelumnya) => tulisNilai(sebelumnya, jalur.slice(1), nilaiBaru) as NilaiMedia)
      }
    />
  )
}

describe('FieldMedia — kasus 1: onChange menerima path/width/height dari berkas', () => {
  it('memanggil onChange dengan path dan dimensi persis hasil bacaDimensi (823x617)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const unggah = vi.fn().mockResolvedValue({ path: 'unggahan/foto-a.jpg' })
    const bacaDimensi = vi.fn().mockResolvedValue({ width: 823, height: 617 })

    render(
      <FieldMedia
        definisi={definisi}
        jalur={['profile_photo']}
        nilai={nilaiKosong}
        errors={{}}
        onChange={onChange}
        bacaDimensi={bacaDimensi}
        unggah={unggah}
      />,
    )

    await user.upload(screen.getByLabelText('Berkas Gambar'), buatBerkasGambar())

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(bacaDimensi).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      ['profile_photo'],
      expect.objectContaining({ path: 'unggahan/foto-a.jpg', width: 823, height: 617 }),
    )
  })

  // Dimensi BERBEDA dari test di atas — kalau komponen mengarang angka tetap
  // (bukan benar-benar memakai hasil `bacaDimensi`), salah satu dari kedua
  // test ini pasti gagal.
  it('memanggil onChange dengan dimensi berbeda (1200x300) saat bacaDimensi mengembalikan itu', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const unggah = vi.fn().mockResolvedValue({ path: 'unggahan/foto-b.png' })
    const bacaDimensi = vi.fn().mockResolvedValue({ width: 1200, height: 300 })

    render(
      <FieldMedia
        definisi={definisi}
        jalur={['profile_photo']}
        nilai={nilaiKosong}
        errors={{}}
        onChange={onChange}
        bacaDimensi={bacaDimensi}
        unggah={unggah}
      />,
    )

    await user.upload(screen.getByLabelText('Berkas Gambar'), buatBerkasGambar('lain.png', 'image/png'))

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    expect(onChange).toHaveBeenCalledWith(
      ['profile_photo'],
      expect.objectContaining({ path: 'unggahan/foto-b.png', width: 1200, height: 300 }),
    )
  })
})

describe('FieldMedia — kasus 2: mengubah alt satu bahasa tidak menghapus bahasa lain', () => {
  it('mengetik di alt Indonesia tidak menghapus alt English yang sudah terisi', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={{ path: 'unggahan/ada.jpg', alt: { id: 'Foto', en: 'Photo' } }} />)

    const inputId = screen.getByLabelText('Teks Alternatif (Indonesia)')
    await user.clear(inputId)
    await user.type(inputId, 'Foto Baru')

    expect(inputId).toHaveValue('Foto Baru')
    expect(screen.getByLabelText('Teks Alternatif (English)')).toHaveValue('Photo')
  })

  it('mengetik di alt English tidak menghapus alt Indonesia yang sudah terisi', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={{ path: 'unggahan/ada.jpg', alt: { id: 'Foto', en: 'Photo' } }} />)

    const inputEn = screen.getByLabelText('Teks Alternatif (English)')
    await user.clear(inputEn)
    await user.type(inputEn, 'New Photo')

    expect(inputEn).toHaveValue('New Photo')
    expect(screen.getByLabelText('Teks Alternatif (Indonesia)')).toHaveValue('Foto')
  })
})

describe('FieldMedia — kasus 3: unggah gagal tidak memanggil onChange, nilai lama utuh', () => {
  it('menampilkan pesan error, tidak memanggil onChange, dan tidak membaca dimensi', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const unggah = vi.fn().mockResolvedValue({ error: 'Ukuran berkas melebihi batas maksimum 5MB.' })
    const bacaDimensi = vi.fn()

    const nilaiLama: NilaiMedia = {
      path: 'unggahan/lama.jpg',
      alt: { id: 'Lama', en: 'Old' },
      width: 400,
      height: 300,
    }

    render(
      <FieldMedia
        definisi={definisi}
        jalur={['profile_photo']}
        nilai={nilaiLama}
        errors={{}}
        onChange={onChange}
        bacaDimensi={bacaDimensi}
        unggah={unggah}
      />,
    )

    await user.upload(screen.getByLabelText('Berkas Gambar'), buatBerkasGambar())

    expect(await screen.findByRole('alert')).toHaveTextContent('Ukuran berkas melebihi batas maksimum 5MB.')
    expect(onChange).not.toHaveBeenCalled()
    expect(bacaDimensi).not.toHaveBeenCalled()
    // Pratayang tetap merujuk path LAMA — bukti nilai lama tidak tertimpa.
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('unggahan/lama.jpg'))
  })
})

describe('FieldMedia — kasus 4: field wajib dengan alt kosong salah satu bahasa ditandai error', () => {
  it('alt English kosong pada field wajib menghasilkan error tepat di alt English', () => {
    const skema = buatSkemaKoleksi(koleksiUji)
    const hasil = skema.safeParse({
      profile_photo: { path: 'unggahan/ada.jpg', alt: { id: 'Foto', en: '' } },
    })
    expect(hasil.success).toBe(false)
    if (hasil.success) throw new Error('unreachable')
    const errors = petaErrorDariZod(hasil.error)

    // Bukti jalur error menyebut anaknya persis — bukan cuma error generik
    // di level field media.
    expect(errors['profile_photo.alt.en']).toBe('Wajib diisi')

    render(
      <FieldMedia
        definisi={definisi}
        jalur={['profile_photo']}
        nilai={{ path: 'unggahan/ada.jpg', alt: { id: 'Foto', en: '' } }}
        errors={errors}
        onChange={vi.fn()}
      />,
    )

    const inputEn = screen.getByLabelText('Teks Alternatif (English)')
    expect(inputEn).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Wajib diisi')).toBeInTheDocument()
    // Alt Indonesia (sudah terisi) TIDAK ditandai invalid.
    expect(screen.getByLabelText('Teks Alternatif (Indonesia)')).toHaveAttribute('aria-invalid', 'false')
  })
})
