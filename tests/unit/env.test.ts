import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/lib/env'

const VALID = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://contoh.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_contoh',
}

describe('parseEnv', () => {
  it('menerima environment yang lengkap dan benar', () => {
    expect(parseEnv(VALID)).toEqual(VALID)
  })

  it('menolak ketika URL Supabase tidak ada', () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: undefined })).toThrow()
  })

  it('menolak ketika URL Supabase bukan URL yang sah', () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: 'bukan-url' })).toThrow()
  })

  it('menolak ketika kunci kosong', () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' })).toThrow()
  })

  it('menolak kunci secret yang salah tempel ke variabel publik', () => {
    // NEXT_PUBLIC_* disulih ke bundel browser. Kunci sb_secret_ di sini akan
    // terkirim ke setiap pengunjung, jadi harus ditolak sebelum sempat di-build.
    expect(() =>
      parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_bocor' }),
    ).toThrow()
  })

  it('menyebut nama variabel yang bermasalah di pesan error', () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: 'bukan-url' })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    )
  })
})
