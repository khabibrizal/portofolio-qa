import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldGrup } from '@/components/admin/field/FieldGrup'
import { RenderField } from '@/components/admin/field/RenderField'
import { tulisNilai, type Jalur } from '@/lib/admin/nilai'
import type { DefinisiField } from '@/lib/admin/skema/tipe'

// Bentuk mirip hero.cta_primary: { label: LocalizedText, link: string }.
const definisiCta: DefinisiField = {
  nama: 'cta_primary',
  label: 'CTA Utama',
  jenis: 'grup',
  wajib: true,
  anak: [
    { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
    { nama: 'link', label: 'Tautan', jenis: 'teks', wajib: true },
  ],
}

/**
 * Pembungkus stateful — persis pola FieldTerlokalisasi.test.tsx: FieldGrup
 * sendiri tidak menyimpan nilai, jadi untuk menguji "mengubah satu anak
 * tidak menghapus anak lain" perlu induk yang benar-benar menyimpan nilai
 * lewat `onChange`, sama seperti yang dilakukan FormSkema di produksi.
 * `jalur.slice(1)` membuang nama grup itu sendiri karena state lokal di sini
 * HANYA berisi isi grup (bukan objek koleksi penuh).
 */
function Pembungkus({ nilaiAwal }: { nilaiAwal: Record<string, unknown> }) {
  const [nilai, setNilai] = useState<Record<string, unknown>>(nilaiAwal)
  return (
    <FieldGrup
      definisi={definisiCta}
      jalur={['cta_primary']}
      nilai={nilai}
      errors={{}}
      onChange={(jalur: Jalur, nilaiBaru: unknown) =>
        setNilai((sebelumnya) => tulisNilai(sebelumnya, jalur.slice(1), nilaiBaru) as Record<string, unknown>)
      }
    />
  )
}

describe('FieldGrup — kasus 5: mengubah satu anak tidak menghapus anak lain', () => {
  it('mengubah field link tidak menghapus label yang sudah terisi', async () => {
    const user = userEvent.setup()
    render(
      <Pembungkus
        nilaiAwal={{ label: { id: 'Lihat Detail', en: 'View Details' }, link: 'https://awal.test' }}
      />,
    )

    const inputLink = screen.getByLabelText('Tautan', { exact: false })
    await user.clear(inputLink)
    await user.type(inputLink, 'https://baru.test')

    expect(inputLink).toHaveValue('https://baru.test')
    // Label (tab aktif default Indonesia) harus tetap utuh.
    expect(screen.getByLabelText('Label (Indonesia)')).toHaveValue('Lihat Detail')

    // Pindah tab EN untuk membuktikan sisi Inggris juga tidak ikut terhapus.
    await user.click(screen.getByRole('tab', { name: /english/i }))
    expect(screen.getByLabelText('Label (English)')).toHaveValue('View Details')
  })

  it('mengubah label tidak menghapus link yang sudah terisi', async () => {
    const user = userEvent.setup()
    render(
      <Pembungkus
        nilaiAwal={{ label: { id: 'Lihat Detail', en: 'View Details' }, link: 'https://awal.test' }}
      />,
    )

    await user.type(screen.getByLabelText('Label (Indonesia)'), ' Lagi')

    expect(screen.getByLabelText('Tautan', { exact: false })).toHaveValue('https://awal.test')
  })
})

describe('FieldGrup — kasus 6: error pada satu anak tampil di anak itu, bukan di anak lain', () => {
  it('error di jalur cta_primary.link hanya tampil di field link', () => {
    render(
      <FieldGrup
        definisi={definisiCta}
        jalur={['cta_primary']}
        nilai={{ label: { id: 'Lihat', en: 'View' }, link: '' }}
        errors={{ 'cta_primary.link': 'Wajib diisi' }}
        onChange={vi.fn()}
      />,
    )

    const grup = screen.getByRole('group', { name: 'CTA Utama' })
    const inputLink = within(grup).getByLabelText('Tautan', { exact: false })
    expect(inputLink).toHaveAttribute('aria-invalid', 'true')

    const alerts = within(grup).getAllByRole('alert')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toHaveTextContent('Wajib diisi')
  })
})

describe('FieldGrup — kasus 7: nilai undefined di awal tetap bisa diisi tanpa melempar', () => {
  it('RenderField menyiapkan bentuk kosong untuk grup yang nilainya undefined', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    expect(() =>
      render(<RenderField definisi={definisiCta} jalur={['cta_primary']} nilai={undefined} errors={{}} onChange={onChange} />),
    ).not.toThrow()

    const grup = screen.getByRole('group', { name: 'CTA Utama' })
    const inputLink = within(grup).getByLabelText('Tautan', { exact: false })
    expect(inputLink).toHaveValue('')
    expect(within(grup).getByLabelText('Label (Indonesia)')).toHaveValue('')

    await user.type(inputLink, 'https://baru.test')
    expect(onChange).toHaveBeenCalled()
  })
})
