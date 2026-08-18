import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldAngka } from '@/components/admin/field/FieldAngka'
import type { DefinisiField } from '@/lib/admin/skema/tipe'

const definisi: DefinisiField = {
  nama: 'proficiency_percent',
  label: 'Penguasaan (%)',
  jenis: 'angka',
  wajib: true,
  min: 0,
  max: 100,
}

describe('FieldAngka', () => {
  it('menampilkan nilai number sebagai teks di kotak angka', () => {
    render(<FieldAngka definisi={definisi} jalur={['proficiency_percent']} nilai={87} onChange={vi.fn()} />)
    expect(screen.getByLabelText('Penguasaan (%)', { exact: false })).toHaveValue(87)
  })

  it('mengirim undefined ke onChange saat dikosongkan, bukan NaN atau string', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FieldAngka definisi={definisi} jalur={['proficiency_percent']} nilai={50} onChange={onChange} />)

    const input = screen.getByLabelText('Penguasaan (%)', { exact: false })
    await user.clear(input)

    expect(onChange).toHaveBeenLastCalledWith(['proficiency_percent'], undefined)
  })

  it('mengirim number (bukan string) saat mengetik angka', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<FieldAngka definisi={definisi} jalur={['proficiency_percent']} nilai={undefined} onChange={onChange} />)

    await user.type(screen.getByLabelText('Penguasaan (%)', { exact: false }), '9')

    expect(onChange).toHaveBeenCalledWith(['proficiency_percent'], 9)
  })
})
