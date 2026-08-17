import type { Locale } from './locales'

export type LocalizedText = { id: string; en: string }

/**
 * Mengambil satu bahasa dari teks dwibahasa.
 *
 * Tidak pernah melempar. Field yang kosong atau hilang menghasilkan string
 * kosong sehingga section yang bersangkutan bisa memilih menyembunyikan
 * dirinya — satu kolom yang lupa diisi tidak boleh menjatuhkan halaman.
 */
export function teks(nilai: LocalizedText | null | undefined, locale: Locale): string {
  if (!nilai) return ''

  const diminta = nilai[locale]?.trim()
  if (diminta) return diminta

  const cadangan = locale === 'id' ? nilai.en : nilai.id
  return cadangan?.trim() ?? ''
}
