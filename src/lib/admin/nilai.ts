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
    case 'media':
      // Alasannya sama dengan 'terlokalisasi' di atas, dan penting justru
      // untuk aksesibilitas: kalau nilai awalnya bukan bentuk objek yang
      // benar, error "alt belum diisi" mendarat di jalur field itu sendiri
      // (mis. "profile_photo") alih-alih di jalur anaknya
      // ("profile_photo.alt.en") — sehingga input alt yang bersangkutan tidak
      // pernah menerima errornya, dan pengisi form tak melihat peringatan
      // apa pun di bahasa yang terlewat.
      return { path: '', alt: { id: '', en: '' } }
    case 'berkas':
      // 'berkas' menyimpan string biasa (object path), bukan objek —
      // kolom seperti site_settings.resume_pdf bertipe text, bukan JSONB.
      return ''
    case 'grup': {
      // Sama seperti alasan 'terlokalisasi' di atas, tapi rekursif: setiap
      // field anak grup diisi bentuk kosongnya SENDIRI (lewat panggilan
      // rekursif ke fungsi ini) — bukan cuma `{}` kosong — supaya grup di
      // dalam grup, atau field terlokalisasi di dalam grup, juga langsung
      // berbentuk benar sejak render pertama. Tanpa ini, field grup yang
      // wajib namun sama sekali tidak ada di nilai akan gagal validasi di
      // jalur field itu sendiri (mis. "cta_primary"), bukan di jalur anaknya
      // ("cta_primary.label.id") — persis bug yang sama yang tadinya
      // ditemukan pada 'terlokalisasi'.
      const bentuk: Record<string, unknown> = {}
      for (const anak of definisi.anak ?? []) bentuk[anak.nama] = nilaiAwalField(anak)
      return bentuk
    }
    default:
      return ''
  }
}

/**
 * Nilai awal untuk satu koleksi utuh — satu key per field, memakai nilai
 * dari `nilaiAwal` kalau field itu memang sudah punya nilai (mis. saat
 * mengedit entri lama), atau bentuk kosong yang benar (`nilaiAwalField`)
 * kalau belum (mis. saat membuat entri baru).
 *
 * `null` diperlakukan SAMA seperti kunci yang hilang sama sekali — bukan
 * dipakai apa adanya. Ditemukan lewat koleksi singleton Task 3
 * (`site_settings.og_image`/`favicon`/`resume_pdf` memang `null` di database
 * untuk kolom yang belum pernah diisi — lihat `supabase/seed.sql`): tanpa
 * pengecualian ini, baris `null` mentah dari database akan mengalir apa
 * adanya ke `nilai` form, dan skema Zod untuk field TIDAK wajib (`teks`,
 * `url`, `berkas`, `media`, ...) semuanya dibungkus `.optional()` — yang
 * cuma menerima `undefined`, BUKAN `null`. Akibatnya menyimpan ULANG
 * singleton apa pun tanpa menyentuh field kosongnya sama sekali (kasus
 * paling umum: mengubah satu field lalu klik Simpan) akan selalu gagal
 * dengan "Data tidak valid", walau field itu sendiri tidak wajib diisi.
 * Bentuk kosong dari `nilaiAwalField` (mis. `''` untuk teks/url/berkas,
 * `{path:'', alt:{id:'',en:''}}` untuk media) sudah pasti valid untuk field
 * yang sama sekali tidak wajib, jadi ini pengganti yang aman.
 */
export function nilaiAwalKoleksi(
  definisi: DefinisiKoleksi,
  // Default `{}` karena kasus "entri baru" memang tidak punya nilai awal.
  // Sebelumnya wajib, dan itu mengundang pemanggil melewatkannya lalu jatuh
  // dengan TypeError di dalam fungsi ini alih-alih mendapat bentuk kosong
  // yang benar.
  nilaiAwal: Record<string, unknown> = {},
): Record<string, unknown> {
  const hasil: Record<string, unknown> = {}
  for (const field of definisi.field) {
    const adaNilai = field.nama in nilaiAwal && nilaiAwal[field.nama] !== null
    hasil[field.nama] = adaNilai ? nilaiAwal[field.nama] : nilaiAwalField(field)
  }
  return hasil
}
