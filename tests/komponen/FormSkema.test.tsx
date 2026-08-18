import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormSkema } from '@/components/admin/FormSkema'
import { skillCategories } from '@/lib/admin/skema/skill-categories'

async function isiCategoryName(user: ReturnType<typeof userEvent.setup>, id: string, en: string) {
  await user.type(screen.getByLabelText('Nama Kategori (Indonesia)'), id)
  await user.click(screen.getByRole('tab', { name: /english/i }))
  await user.type(screen.getByLabelText('Nama Kategori (English)'), en)
}

describe('FormSkema — kasus 7: submit invalid tidak menulis', () => {
  it('onSimpan TIDAK dipanggil sama sekali, dan error tampil', async () => {
    const onSimpan = vi.fn()
    const user = userEvent.setup()
    render(<FormSkema definisi={skillCategories} nilaiAwal={{}} onSimpan={onSimpan} />)

    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(onSimpan).not.toHaveBeenCalled()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
  })
})

describe('FormSkema — kasus 8: submit valid menulis tepat sekali', () => {
  it('onSimpan dipanggil tepat sekali dengan payload yang benar', async () => {
    const onSimpan = vi.fn()
    const user = userEvent.setup()
    render(<FormSkema definisi={skillCategories} nilaiAwal={{ skills: [] }} onSimpan={onSimpan} />)

    await isiCategoryName(user, 'Pengembang Frontend', 'Frontend Developer')

    await user.click(screen.getByRole('button', { name: /^tambah/i }))
    const barisPertama = screen.getByRole('group', { name: 'Baris 1' })
    await user.type(within(barisPertama).getByLabelText('Nama', { exact: false }), 'React')
    await user.type(within(barisPertama).getByLabelText('Penguasaan (%)', { exact: false }), '90')

    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(onSimpan).toHaveBeenCalledTimes(1)
    expect(onSimpan).toHaveBeenCalledWith({
      category_name: { id: 'Pengembang Frontend', en: 'Frontend Developer' },
      skills: [{ name: 'React', proficiency_percent: 90 }],
    })
  })
})

describe('FormSkema — kasus 9: field wajib kosong ditandai sebelum submit berhasil', () => {
  it('menampilkan error di category_name saat masih kosong, tanpa memanggil onSimpan', async () => {
    const onSimpan = vi.fn()
    const user = userEvent.setup()
    render(<FormSkema definisi={skillCategories} nilaiAwal={{}} onSimpan={onSimpan} />)

    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    // Kedua tab bahasa dari field wajib category_name tertandai kosong,
    // dan error tampil sebelum sempat memanggil onSimpan.
    expect(screen.getByRole('tab', { name: /indonesia \(belum diisi\)/i })).toBeVisible()
    expect(screen.getByRole('tab', { name: /english \(belum diisi\)/i })).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Wajib diisi')
    expect(onSimpan).not.toHaveBeenCalled()
  })
})

describe('FormSkema — peringatan perubahan belum tersimpan', () => {
  let tambahListener: ReturnType<typeof vi.spyOn>
  let hapusListener: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tambahListener = vi.spyOn(window, 'addEventListener')
    hapusListener = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    tambahListener.mockRestore()
    hapusListener.mockRestore()
  })

  it('memasang listener beforeunload begitu ada perubahan, dan melepasnya setelah tersimpan', async () => {
    const onSimpan = vi.fn()
    const user = userEvent.setup()
    render(<FormSkema definisi={skillCategories} nilaiAwal={{ skills: [] }} onSimpan={onSimpan} />)

    expect(tambahListener).not.toHaveBeenCalledWith('beforeunload', expect.anything())

    await user.type(screen.getByLabelText('Nama Kategori (Indonesia)'), 'a')
    expect(tambahListener).toHaveBeenCalledWith('beforeunload', expect.anything())

    await user.click(screen.getByRole('tab', { name: /english/i }))
    await user.type(screen.getByLabelText('Nama Kategori (English)'), 'b')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(onSimpan).toHaveBeenCalledTimes(1)
    expect(hapusListener).toHaveBeenCalledWith('beforeunload', expect.anything())
  })
})
