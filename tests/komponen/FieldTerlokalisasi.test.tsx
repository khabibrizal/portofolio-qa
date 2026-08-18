import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldTerlokalisasi } from '@/components/admin/field/FieldTerlokalisasi'
import { tulisNilai, type Jalur } from '@/lib/admin/nilai'
import type { DefinisiField } from '@/lib/admin/skema/tipe'

const definisi: DefinisiField = { nama: 'category_name', label: 'Nama Kategori', jenis: 'terlokalisasi', wajib: true }

/**
 * Pembungkus stateful — FieldTerlokalisasi sendiri tidak menyimpan nilai
 * (cuma tab aktif), jadi untuk menguji "mengetik di satu tab tidak
 * menghapus tab lain" perlu induk yang benar-benar menyimpan nilai lewat
 * `onChange`, persis seperti yang dilakukan FormSkema di produksi.
 */
function Pembungkus({ errors = {} }: { errors?: { id?: string; en?: string } }) {
  const [nilai, setNilai] = useState<{ id: string; en: string }>({ id: '', en: '' })
  return (
    <FieldTerlokalisasi
      definisi={definisi}
      jalur={['category_name']}
      nilai={nilai}
      errors={errors}
      onChange={(jalur: Jalur, nilaiBaru: unknown) =>
        setNilai((sebelumnya) => tulisNilai(sebelumnya, jalur.slice(1), nilaiBaru) as { id: string; en: string })
      }
    />
  )
}

describe('FieldTerlokalisasi — kasus 1: isolasi antar bahasa', () => {
  it('mengetik di tab ID tidak menghapus nilai EN', async () => {
    const user = userEvent.setup()
    render(<Pembungkus />)

    await user.type(screen.getByLabelText('Nama Kategori (Indonesia)'), 'Pengembang Frontend')
    await user.click(screen.getByRole('tab', { name: /english/i }))
    await user.type(screen.getByLabelText('Nama Kategori (English)'), 'Frontend Developer')

    expect(screen.getByLabelText('Nama Kategori (English)')).toHaveValue('Frontend Developer')

    await user.click(screen.getByRole('tab', { name: /^tab indonesia$/i }))
    expect(screen.getByLabelText('Nama Kategori (Indonesia)')).toHaveValue('Pengembang Frontend')
  })

  it('mengetik di tab EN tidak menghapus nilai ID', async () => {
    const user = userEvent.setup()
    render(<Pembungkus />)

    await user.click(screen.getByRole('tab', { name: /english/i }))
    await user.type(screen.getByLabelText('Nama Kategori (English)'), 'Frontend Developer')
    await user.click(screen.getByRole('tab', { name: /indonesia/i }))
    await user.type(screen.getByLabelText('Nama Kategori (Indonesia)'), 'Pengembang Frontend')

    expect(screen.getByLabelText('Nama Kategori (Indonesia)')).toHaveValue('Pengembang Frontend')

    await user.click(screen.getByRole('tab', { name: /^tab english$/i }))
    expect(screen.getByLabelText('Nama Kategori (English)')).toHaveValue('Frontend Developer')
  })
})

describe('FieldTerlokalisasi — kasus 2: penanda bahasa kosong terlihat tanpa berpindah tab', () => {
  it('tab EN yang kosong berlabel "belum diisi" walau tab ID yang aktif', () => {
    render(
      <FieldTerlokalisasi
        definisi={definisi}
        jalur={['category_name']}
        nilai={{ id: 'Pengembang Frontend', en: '' }}
        errors={{}}
        onChange={vi.fn()}
      />,
    )

    // Tab EN kosong: penanda ada TANPA perlu mengeklik tabnya.
    expect(screen.getByRole('tab', { name: /english \(belum diisi\)/i })).toBeVisible()
    // Tab ID sudah terisi: tidak ada penanda "belum diisi".
    expect(screen.queryByRole('tab', { name: /indonesia \(belum diisi\)/i })).not.toBeInTheDocument()
  })

  it('kedua tab ditandai "belum diisi" saat keduanya kosong', () => {
    render(
      <FieldTerlokalisasi
        definisi={definisi}
        jalur={['category_name']}
        nilai={{ id: '', en: '' }}
        errors={{}}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('tab', { name: /indonesia \(belum diisi\)/i })).toBeVisible()
    expect(screen.getByRole('tab', { name: /english \(belum diisi\)/i })).toBeVisible()
  })

  it('tidak ada tab yang ditandai "belum diisi" saat keduanya terisi', () => {
    render(
      <FieldTerlokalisasi
        definisi={definisi}
        jalur={['category_name']}
        nilai={{ id: 'Pengembang Frontend', en: 'Frontend Developer' }}
        errors={{}}
        onChange={vi.fn()}
      />,
    )

    expect(screen.queryByText(/belum diisi/i)).not.toBeInTheDocument()
  })
})

describe('FieldTerlokalisasi — error per bahasa', () => {
  it('menampilkan error hanya untuk tab yang sedang aktif', () => {
    render(
      <FieldTerlokalisasi
        definisi={definisi}
        jalur={['category_name']}
        nilai={{ id: '', en: '' }}
        errors={{ id: 'Wajib diisi', en: 'Wajib diisi' }}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Wajib diisi')
  })
})
