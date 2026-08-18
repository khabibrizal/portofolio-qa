import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldTeks } from '@/components/admin/field/FieldTeks'
import type { DefinisiField } from '@/lib/admin/skema/tipe'

const definisi: DefinisiField = { nama: 'name', label: 'Nama', jenis: 'teks', wajib: true }

describe('FieldTeks', () => {
  it('menampilkan label dan nilai lewat kotak teks berlabel', () => {
    render(<FieldTeks definisi={definisi} jalur={['name']} nilai="React" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Nama', { exact: false })).toHaveValue('React')
  })

  it('memanggil onChange dengan jalur dan nilai baru saat diketik', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FieldTeks definisi={definisi} jalur={['name']} nilai="" onChange={onChange} />)

    await user.type(screen.getByLabelText('Nama', { exact: false }), 'Vue')

    // Setiap keystroke controlled memanggil onChange satu kali dengan
    // karakter yang diketik (nilai selalu mulai dari '' karena input
    // terkendali tidak menyimpan state sendiri).
    expect(onChange).toHaveBeenCalledWith(['name'], 'V')
    expect(onChange).toHaveBeenCalledTimes(3)
  })

  it('menampilkan pesan error sebagai alert saat error diberikan', () => {
    render(<FieldTeks definisi={definisi} jalur={['name']} nilai="" error="Wajib diisi" onChange={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Wajib diisi')
  })

  it('merender textarea untuk jenis teks-panjang', () => {
    const definisiPanjang: DefinisiField = { ...definisi, jenis: 'teks-panjang' }
    render(<FieldTeks definisi={definisiPanjang} jalur={['name']} nilai="" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Nama', { exact: false }).tagName).toBe('TEXTAREA')
  })
})
