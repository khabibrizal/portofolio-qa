import { z } from 'zod'
import type { DefinisiField, DefinisiKoleksi } from './tipe'

/**
 * Menurunkan validator Zod untuk satu field.
 *
 * Field yang tidak `wajib` dibungkus `.optional()` di lapisan luar — nilai
 * yang kosong/hilang tidak pernah memicu error. Tapi begitu nilainya ADA,
 * batasan per-jenis (min/max, opsi, bentuk URL, bentuk baris repeater) tetap
 * berlaku sepenuhnya; opsional cuma berarti "boleh tidak diisi", bukan
 * "kalau diisi bebas apa saja".
 */
export function buatSkemaField(definisi: DefinisiField): z.ZodTypeAny {
  const skema = skemaUntukJenis(definisi)
  return definisi.wajib ? skema : skema.optional()
}

function skemaUntukJenis(definisi: DefinisiField): z.ZodTypeAny {
  switch (definisi.jenis) {
    case 'teks':
    case 'teks-panjang':
    case 'tanggal':
      return definisi.wajib ? z.string().min(1, 'Wajib diisi') : z.string()

    case 'terlokalisasi':
    case 'terlokalisasi-panjang':
      return skemaTerlokalisasi(definisi.wajib ?? false)

    case 'angka': {
      let skema = z.number()
      if (definisi.min !== undefined) skema = skema.min(definisi.min, `Minimal ${definisi.min}`)
      if (definisi.max !== undefined) skema = skema.max(definisi.max, `Maksimal ${definisi.max}`)
      return skema
    }

    case 'pilihan': {
      const nilai = (definisi.opsi ?? []).map((o) => o.nilai)
      if (nilai.length === 0) {
        throw new Error(`Field pilihan "${definisi.nama}" tidak mendefinisikan "opsi"`)
      }
      return z.enum(nilai as [string, ...string[]], {
        error: () => `Pilih salah satu dari opsi yang tersedia untuk "${definisi.label}"`,
      })
    }

    case 'url':
      // Kosong hanya boleh ketika field tidak wajib — itu ditangani `.optional()`
      // di buatSkemaField untuk jenis lain, tapi string kosong ('') bukan
      // `undefined` sehingga tidak lolos lewat `.optional()`. Union ini yang
      // membuat '' diterima sebagai representasi "belum diisi" untuk URL.
      return definisi.wajib
        ? z.url('URL tidak valid')
        : z.union([z.literal(''), z.url('URL tidak valid')])

    case 'daftar-teks':
      return z.array(z.string())

    case 'repeater': {
      const baris = buatSkemaBaris(definisi.anak ?? [])
      let skema = z.array(baris)
      if (definisi.wajib) skema = skema.min(1, 'Minimal satu baris')
      return skema
    }

    case 'grup':
      // Objek tunggal berfield tetap — bukan array seperti 'repeater'. Setiap
      // field anak divalidasi lewat skemanya sendiri (termasuk `wajib`-nya
      // masing-masing), dan karena ini z.object bersarang, Zod otomatis
      // menambahkan nama field anak (dan seterusnya untuk grup bersarang) di
      // depan path issue-nya — jadi error di dalam grup selalu punya alamat
      // (mis. ['cta_primary', 'link'] atau ['cta_primary', 'label', 'id']),
      // tidak pernah muncul tanpa menyebut anak mana yang salah.
      return buatSkemaBaris(definisi.anak ?? [])

    default:
      return takTerduga(definisi.jenis)
  }
}

/**
 * Kunci `id` dan `en` selalu wajib ADA sebagai string (bentuk `LocalizedText`
 * tidak sah tanpa keduanya) — itu berlaku baik field-nya wajib diisi maupun
 * tidak. Yang berbeda hanya apakah isinya boleh kosong: `superRefine` di sini
 * cuma dipasang ketika field-nya wajib, dan menandai persis kunci mana yang
 * kosong lewat `path` supaya form bisa menyorot tab bahasa yang salah.
 */
function skemaTerlokalisasi(wajib: boolean) {
  const dasar = z.object({ id: z.string(), en: z.string() })
  if (!wajib) return dasar

  return dasar.superRefine((nilai, ctx) => {
    if (!nilai.id.trim()) {
      ctx.addIssue({ code: 'custom', path: ['id'], message: 'Wajib diisi' })
    }
    if (!nilai.en.trim()) {
      ctx.addIssue({ code: 'custom', path: ['en'], message: 'Wajib diisi' })
    }
  })
}

function buatSkemaBaris(anak: DefinisiField[]) {
  const bentuk: Record<string, z.ZodTypeAny> = {}
  for (const field of anak) {
    bentuk[field.nama] = buatSkemaField(field)
  }
  return z.object(bentuk)
}

function takTerduga(jenis: never): never {
  throw new Error(`Jenis field tidak dikenal: ${String(jenis)}`)
}

/**
 * Menurunkan skema Zod untuk satu koleksi utuh — objek dengan satu key per
 * field, dikunci ke `nama`-nya. Dipakai baik oleh validasi klien (form) maupun
 * validasi server (Server Action) supaya keduanya selalu sinkron dengan satu
 * sumber definisi yang sama.
 */
export function buatSkemaKoleksi(definisi: DefinisiKoleksi) {
  return buatSkemaBaris(definisi.field)
}

/**
 * Meratakan `ZodError` jadi peta jalur -> pesan (mis. `{"category_name.en":
 * "Wajib diisi", "skills.2.name": "Wajib diisi"}`). Kalau ada lebih dari satu
 * isu di jalur yang sama, isu pertama yang menang.
 *
 * `FormSkema` memakai peta ini untuk mencocokkan error ke field yang tepat —
 * termasuk baris keberapa di repeater dan sisi bahasa mana di field
 * terlokalisasi — persis yang membuat pesan error repeater menyebut indeks
 * barisnya (lihat test Task 3) dan yang membuat FieldTerlokalisasi bisa
 * menyorot tab bahasa yang salah.
 */
export function petaErrorDariZod(error: z.ZodError): Record<string, string> {
  const peta: Record<string, string> = {}
  for (const issue of error.issues) {
    const kunci = issue.path.join('.')
    if (!(kunci in peta)) peta[kunci] = issue.message
  }
  return peta
}
