import { teks } from '@/lib/i18n/resolve'
import type { DefinisiKoleksi } from './skema/tipe'
import { createClient } from '@/lib/supabase/server'

export type StatusEntri = 'draft' | 'published'

/** Satu baris entri koleksi apa pun — bentuknya generik karena field di luar
 * `id`/`status`/`sort_order` berbeda-beda per koleksi (lihat `DefinisiKoleksi`). */
export type BarisEntri = {
  id: string
  status: StatusEntri
  sort_order: number
} & Record<string, unknown>

/**
 * Menghitung SELURUH entri (draft + terbit) suatu koleksi, untuk lencana
 * cacah di daftar koleksi `/admin`.
 *
 * WAJIB memakai klien berbasis cookie (`createClient` dari `supabase/server`),
 * BUKAN klien anonim (`supabase/public`): RLS membatasi baris berstatus
 * `draft` hanya boleh dibaca pemiliknya yang sedang login. Klien anonim akan
 * membuat cacah ini diam-diam kehilangan seluruh draft, tanpa error apa pun.
 */
export async function hitungEntri(tabel: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase.from(tabel).select('*', { count: 'exact', head: true })

  if (error) throw new Error(`Gagal menghitung entri ${tabel}: ${error.message}`)
  return count ?? 0
}

/**
 * Mengambil SELURUH baris (draft + terbit) suatu koleksi, terurut
 * `sort_order`, untuk daftar entri `/admin/[koleksi]`.
 *
 * Klien dan alasannya sama seperti `hitungEntri` di atas — admin harus tetap
 * melihat draft, beda dengan query landing di `lib/content/queries.ts` yang
 * sengaja memfilter `status = 'published'` lewat klien anonim.
 */
export async function ambilEntri(tabel: string): Promise<BarisEntri[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(tabel)
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal memuat entri ${tabel}: ${error.message}`)
  return (data ?? []) as BarisEntri[]
}

/**
 * Menampilkan nilai kolom judul suatu entri sebagai teks admin.
 *
 * Field `terlokalisasi`/`terlokalisasi-panjang` tersimpan sebagai objek
 * dwibahasa `{ id, en }` — merender objek itu langsung menghasilkan
 * "[object Object]" di layar. Antarmuka admin berbahasa Indonesia saja
 * (D15), jadi selalu diresolusikan ke `id` lewat `teks()`, dengan `en`
 * sebagai cadangan bila `id` kosong (perilaku bawaan `teks()`).
 */
export function judulEntri(definisi: DefinisiKoleksi, baris: BarisEntri): string {
  const nilai = baris[definisi.kolomJudul]
  const fieldJudul = definisi.field.find((f) => f.nama === definisi.kolomJudul)

  const dwibahasa = fieldJudul?.jenis === 'terlokalisasi' || fieldJudul?.jenis === 'terlokalisasi-panjang'
  if (dwibahasa) {
    const hasil = teks(nilai as { id: string; en: string } | null | undefined, 'id')
    return hasil || '(tanpa judul)'
  }

  if (typeof nilai === 'string' && nilai.trim()) return nilai
  return '(tanpa judul)'
}
