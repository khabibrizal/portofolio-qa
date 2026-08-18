import type { DefinisiField, DefinisiKoleksi } from './skema/tipe'

/**
 * Sebuah jalur ke satu nilai bersarang di dalam objek nilai form, mis.
 * `['skills', 2, 'name']` menunjuk field `name` di baris ke-2 (0-based) dari
 * repeater `skills`, atau `['category_name', 'en']` menunjuk sisi Inggris
 * dari field terlokalisasi `category_name`.
 */
export type Jalur = (string | number)[]

/**
 * Membaca nilai di sebuah jalur bersarang dari objek/array nilai form.
 * Mengembalikan `undefined` kalau jalur mana pun di tengah tidak ada —
 * dipakai supaya pembaca tidak perlu memeriksa keberadaan setiap tingkat
 * secara manual.
 */
export function bacaNilai(root: unknown, jalur: Jalur): unknown {
  return jalur.reduce<unknown>((akumulator, kunci) => {
    if (akumulator === null || akumulator === undefined) return undefined
    return (akumulator as Record<string | number, unknown>)[kunci]
  }, root)
}

/**
 * Menulis nilai baru di sebuah jalur bersarang, secara IMUTABEL — setiap
 * objek/array di sepanjang jalur disalin, bukan dimutasi di tempat.
 *
 * Ini yang membuat React mendeteksi perubahan lewat referensi baru, dan yang
 * menjaga kunci-kunci LAIN yang tidak disentuh (mis. `en` saat yang diubah
 * `id`) tetap utuh — kegagalan paling merusak yang disebut spec: mengetik di
 * satu bahasa tidak boleh menghapus bahasa yang lain.
 */
export function tulisNilai(root: unknown, jalur: Jalur, nilaiBaru: unknown): unknown {
  if (jalur.length === 0) return nilaiBaru

  const [kunci, ...sisaJalur] = jalur

  if (typeof kunci === 'number') {
    const larik = Array.isArray(root) ? [...root] : []
    larik[kunci] = tulisNilai(larik[kunci], sisaJalur, nilaiBaru)
    return larik
  }

  const objek =
    root && typeof root === 'object' && !Array.isArray(root)
      ? { ...(root as Record<string, unknown>) }
      : {}
  objek[kunci] = tulisNilai(objek[kunci], sisaJalur, nilaiBaru)
  return objek
}

/**
 * Nilai default untuk satu field, dipakai untuk mengisi bentuk yang BENAR
 * sejak awal (bukan `undefined`/kunci hilang sama sekali).
 *
 * Ini bukan cuma kerapian tampilan: kalau field `terlokalisasi` yang wajib
 * sama sekali TIDAK ADA di nilai (bukan `{id:'', en:''}` tapi betul-betul
 * hilang), Zod gagal di jalur field itu sendiri (`category_name`) — bukan di
 * `category_name.id`/`category_name.en` — karena tipe dasarnya (objek) sudah
 * tidak cocok sebelum `superRefine` sempat jalan. Akibatnya
 * `FieldTerlokalisasi` tidak pernah menerima error di jalur yang dibacanya,
 * dan pengguna tidak melihat alert sama sekali di tab manapun. Mengisi
 * bentuk kosong yang BENAR sejak render pertama membuat validasi selalu
 * sampai ke sub-field yang tepat.
 */
export function nilaiAwalField(definisi: DefinisiField): unknown {
  switch (definisi.jenis) {
    case 'terlokalisasi':
    case 'terlokalisasi-panjang':
      return { id: '', en: '' }
    case 'repeater':
    case 'daftar-teks':
      return []
    case 'angka':
      return undefined
    default:
      return ''
  }
}

/**
 * Nilai awal untuk satu koleksi utuh — satu key per field, memakai nilai
 * dari `nilaiAwal` kalau field itu memang sudah punya nilai (mis. saat
 * mengedit entri lama), atau bentuk kosong yang benar (`nilaiAwalField`)
 * kalau belum (mis. saat membuat entri baru).
 */
export function nilaiAwalKoleksi(
  definisi: DefinisiKoleksi,
  nilaiAwal: Record<string, unknown>,
): Record<string, unknown> {
  const hasil: Record<string, unknown> = {}
  for (const field of definisi.field) {
    hasil[field.nama] = field.nama in nilaiAwal ? nilaiAwal[field.nama] : nilaiAwalField(field)
  }
  return hasil
}
