import { describe, expect, it } from 'vitest'
import { tautanLokal } from '@/lib/i18n/tautan'

describe('tautanLokal', () => {
  it('memberi awalan bahasa pada tautan internal tanpa awalan', () => {
    expect(tautanLokal('/cv', 'id')).toBe('/id/cv')
    expect(tautanLokal('/cv', 'en')).toBe('/en/cv')
  })

  it('membiarkan tautan yang sudah menyebut bahasa tertentu', () => {
    // Pemilik mungkin memang ingin menunjuk satu bahasa; jangan ditimpa.
    expect(tautanLokal('/en/cv', 'id')).toBe('/en/cv')
    expect(tautanLokal('/id/cv', 'en')).toBe('/id/cv')
  })

  it('membiarkan jangkar apa adanya', () => {
    // Jangkar menunjuk ke halaman yang sedang dibuka; memberinya awalan
    // bahasa justru mengubahnya jadi navigasi ke halaman lain.
    expect(tautanLokal('#kontak', 'id')).toBe('#kontak')
  })

  it('membiarkan tautan absolut dan skema non-http', () => {
    expect(tautanLokal('https://contoh.dev', 'id')).toBe('https://contoh.dev')
    expect(tautanLokal('mailto:a@b.c', 'en')).toBe('mailto:a@b.c')
    expect(tautanLokal('https://wa.me/628000000000', 'id')).toBe('https://wa.me/628000000000')
  })

  it('tidak melempar untuk string kosong', () => {
    expect(tautanLokal('', 'id')).toBe('')
  })
})
