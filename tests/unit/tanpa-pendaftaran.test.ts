import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Spec §7: aplikasi ini tidak punya pendaftaran publik, dan itu dimatikan di
 * level proyek Supabase — bukan sekadar disembunyikan dari menu.
 *
 * Test ini menjaga sisi kode: tidak boleh ada satu pun pemanggilan API
 * pendaftaran di seluruh sumber. Diperiksa di tingkat berkas, bukan lewat
 * HTTP, karena pertanyaannya memang "apakah kemampuannya ada" — bukan
 * "apakah satu URL tertentu menjawab 404". Rumusan berbasis URL sudah pernah
 * dicoba dan justru melahirkan daftar path yang dilewatkan dari pemeriksaan
 * sesi di kode produksi.
 */
const AKAR = resolve(process.cwd(), 'src')

const TERLARANG = [
  { pola: /\.signUp\s*\(/, nama: 'supabase.auth.signUp()' },
  { pola: /\/auth\/v1\/signup/, nama: 'endpoint REST /auth/v1/signup' },
  { pola: /signInWithOtp\s*\(/, nama: 'signInWithOtp() — jalur masuk tanpa kata sandi' },
]

function seluruhBerkasSumber(dir: string): string[] {
  const hasil: string[] = []
  for (const entri of readdirSync(dir)) {
    const jalur = join(dir, entri)
    if (statSync(jalur).isDirectory()) {
      hasil.push(...seluruhBerkasSumber(jalur))
    } else if (/\.(ts|tsx)$/.test(entri)) {
      hasil.push(jalur)
    }
  }
  return hasil
}

describe('tidak ada kemampuan pendaftaran di kode', () => {
  const berkas = seluruhBerkasSumber(AKAR)

  it('menemukan berkas sumber untuk diperiksa', () => {
    // Tanpa ini, penelusuran yang gagal akan membuat test di bawah lulus
    // dengan nol berkas — hijau yang tidak memeriksa apa pun.
    expect(berkas.length).toBeGreaterThan(10)
  })

  for (const { pola, nama } of TERLARANG) {
    it(`tidak memanggil ${nama}`, () => {
      const pelanggar = berkas.filter((f) => pola.test(readFileSync(f, 'utf8')))
      expect(pelanggar, `ditemukan di: ${pelanggar.join(', ')}`).toEqual([])
    })
  }
})
