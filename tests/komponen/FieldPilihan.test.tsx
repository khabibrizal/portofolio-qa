import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldPilihan } from '@/components/admin/field/FieldPilihan'
import type { DefinisiField } from '@/lib/admin/skema/tipe'

const definisi: DefinisiField = {
  nama: 'availability_status',
  label: 'Status Ketersediaan',
  jenis: 'pilihan',
  wajib: true,
  opsi: [
    { nilai: 'available', label: 'Tersedia' },
    { nilai: 'busy', label: 'Sibuk' },
  ],
}

describe('FieldPilihan', () => {
  it('merender semua opsi dan memilih nilai yang sedang aktif', () => {
    render(<FieldPilihan definisi={definisi} jalur={['availability_status']} nilai="busy" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Status Ketersediaan', { exact: false })).toHaveValue('busy')
    expect(screen.getByRole('option', { name: 'Tersedia' })).toBeInTheDocument()
  })

  it('memanggil onChange dengan nilai opsi yang dipilih', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FieldPilihan definisi={definisi} jalur={['availability_status']} nilai="" onChange={onChange} />)

    await user.selectOptions(screen.getByLabelText('Status Ketersediaan', { exact: false }), 'available')

    expect(onChange).toHaveBeenCalledWith(['availability_status'], 'available')
  })
})
