'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ambilEntri } from './entri'
import { cariDefinisiKoleksi } from './skema'
import { buatSkemaKoleksi } from './skema/ke-zod'
import { createClient } from '@/lib/supabase/server'

const skemaMasuk = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export type HasilMasuk = { error: string } | undefined

// Satu pesan yang sama untuk email tak dikenal maupun password salah —
// membedakan keduanya membocorkan apakah sebuah email terdaftar di sistem.
const PESAN_GAGAL = 'Email atau kata sandi salah.'

/**
 * Server Action login. Dipakai lewat `useActionState` di form login supaya
 * pesan error bisa ditampilkan tanpa reload dan tanpa halaman error generik.
 */
export async function masuk(_state: HasilMasuk, formData: FormData): Promise<HasilMasuk> {
  const hasil = skemaMasuk.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!hasil.success) {
    return { error: PESAN_GAGAL }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(hasil.data)

  if (error) {
    return { error: PESAN_GAGAL }
  }

  redirect('/admin')
}

/** Server Action logout, dipanggil langsung dari `<form action={keluar}>`. */
export async function keluar() {
  const supabase = await createClient()
  // scope: 'local' — HANYA mencabut sesi di browser ini. Default signOut()
  // Supabase adalah scope 'global', yang mencabut refresh token pengguna di
  // SEMUA sesi/perangkat sekaligus. Itu ketidaksesuaian dengan tombol
  // "Keluar" satu perangkat, dan di test E2E lokal (banyak worker paralel,
  // satu akun admin nyata dipakai bersama) itu konkret: logout di satu test
  // mencabut sesi test lain yang masih berjalan, membuatnya dialihkan balik
  // ke /admin/login secara acak — ditemukan saat menambah admin-daftar.spec.ts
  // (Task 5) yang untuk pertama kalinya menjalankan >1 sesi nyata sekaligus.
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/admin/login')
}

/**
 * Merevalidasi kedua locale landing supaya perubahan tulis (simpan, terbit,
 * jadikan draft, hapus, urutkan) langsung terlihat tanpa menunggu
 * `revalidate = 300` maupun deploy ulang.
 *
 * Bentuk yang dipakai adalah PATH LITERAL — `revalidatePath('/id')` dan
 * `revalidatePath('/en')` — bukan pola rute dinamis `revalidatePath('/[locale]',
 * 'page')`. Dibuktikan lewat uji daya gigit Task 6: pola rute dinamis dicoba
 * lebih dulu dan TIDAK merambat ke halaman yang sudah pernah dirender —
 * `revalidatePath('/[locale]', 'page')` hanya menjadwalkan revalidasi untuk
 * kunjungan BERIKUTNYA ke pola itu, bukan langsung ke setiap path konkret yang
 * sudah ada di cache ISR (`/id`, `/en`), sehingga test siklus penuh membaca
 * versi lama sampai jendela 300 detik lewat — persis kegagalan yang harus
 * dibuktikan tidak ada di sini. Path literal per-locale-lah yang benar-benar
 * bekerja, karena Next men-tag entri cache ISR memakai path yang sungguh
 * diminta pengunjung, bukan pola berkasnya.
 */
function revalidasiLanding() {
  revalidatePath('/id')
  revalidatePath('/en')
}

export type HasilSimpan = { error: string } | { ok: true; id: string }

/**
 * Menyimpan entri koleksi — insert kalau `id === 'baru'`, update sebaliknya.
 *
 * WAJIB memvalidasi ulang dengan Zod DI SINI, memakai skema yang sama dengan
 * `FormSkema` (satu sumber, Task 3): validasi klien cuma kenyamanan, Server
 * Action ini bisa dipanggil langsung tanpa lewat form sama sekali (D16), dan
 * itu satu-satunya penjaga yang benar-benar tidak bisa dilewati.
 *
 * Sengaja TIDAK menyentuh kolom `status` — insert baru mengandalkan default
 * kolom (`draft`), dan update tidak boleh diam-diam menerbitkan ulang entri
 * yang sedang draft atau menjadikan draft entri yang sedang terbit. Perubahan
 * status murni lewat `terbitkan`/`jadikanDraft`.
 */
export async function simpan(
  koleksiSlug: string,
  id: string,
  data: Record<string, unknown>,
): Promise<HasilSimpan> {
  const definisi = cariDefinisiKoleksi(koleksiSlug)
  const hasil = buatSkemaKoleksi(definisi).safeParse(data)

  if (!hasil.success) {
    return { error: 'Data tidak valid — periksa kembali isian form.' }
  }

  const supabase = await createClient()

  if (id === 'baru') {
    const entriSekarang = await ambilEntri(definisi.tabel)
    const sortOrderBaru =
      entriSekarang.length === 0 ? 1 : Math.max(...entriSekarang.map((e) => e.sort_order)) + 1

    const { data: baris, error } = await supabase
      .from(definisi.tabel)
      .insert({ ...hasil.data, sort_order: sortOrderBaru })
      .select('id')
      .single()

    if (error) return { error: `Gagal menyimpan: ${error.message}` }

    revalidasiLanding()
    return { ok: true, id: baris.id as string }
  }

  const { error } = await supabase.from(definisi.tabel).update(hasil.data).eq('id', id)
  if (error) return { error: `Gagal menyimpan: ${error.message}` }

  revalidasiLanding()
  return { ok: true, id }
}

export type HasilAksiEntri = { error: string } | undefined

/** Menerbitkan satu entri — landing mulai menampilkannya setelah ini. */
export async function terbitkan(koleksiSlug: string, id: string): Promise<HasilAksiEntri> {
  const definisi = cariDefinisiKoleksi(koleksiSlug)
  const supabase = await createClient()

  const { error } = await supabase.from(definisi.tabel).update({ status: 'published' }).eq('id', id)
  if (error) return { error: `Gagal menerbitkan: ${error.message}` }

  revalidasiLanding()
}

/** Mengembalikan satu entri ke draft — landing berhenti menampilkannya. */
export async function jadikanDraft(koleksiSlug: string, id: string): Promise<HasilAksiEntri> {
  const definisi = cariDefinisiKoleksi(koleksiSlug)
  const supabase = await createClient()

  const { error } = await supabase.from(definisi.tabel).update({ status: 'draft' }).eq('id', id)
  if (error) return { error: `Gagal menjadikan draft: ${error.message}` }

  revalidasiLanding()
}

/** Menghapus satu entri secara permanen. */
export async function hapus(koleksiSlug: string, id: string): Promise<HasilAksiEntri> {
  const definisi = cariDefinisiKoleksi(koleksiSlug)
  const supabase = await createClient()

  const { error } = await supabase.from(definisi.tabel).delete().eq('id', id)
  if (error) return { error: `Gagal menghapus: ${error.message}` }

  revalidasiLanding()
}

/**
 * Menukar `sort_order` satu entri dengan tetangga langsungnya (naik = ke
 * indeks sebelumnya, turun = ke indeks berikutnya) di dalam urutan yang
 * sedang berlaku. Diam-diam tidak melakukan apa pun kalau entri sudah di
 * ujung (tidak ada tetangga ke arah itu) — bukan error, ujung daftar memang
 * seharusnya tidak bisa naik/turun lebih jauh.
 */
export async function urutkan(
  koleksiSlug: string,
  id: string,
  arah: 'naik' | 'turun',
): Promise<HasilAksiEntri> {
  const definisi = cariDefinisiKoleksi(koleksiSlug)
  const entri = await ambilEntri(definisi.tabel)

  const index = entri.findIndex((e) => e.id === id)
  if (index === -1) return { error: 'Entri tidak ditemukan.' }

  const tujuan = arah === 'naik' ? index - 1 : index + 1
  if (tujuan < 0 || tujuan >= entri.length) return

  const a = entri[index]!
  const b = entri[tujuan]!
  const supabase = await createClient()

  const { error: errorA } = await supabase
    .from(definisi.tabel)
    .update({ sort_order: b.sort_order })
    .eq('id', a.id)
  const { error: errorB } = await supabase
    .from(definisi.tabel)
    .update({ sort_order: a.sort_order })
    .eq('id', b.id)

  if (errorA || errorB) {
    return { error: `Gagal mengurutkan: ${errorA?.message ?? errorB?.message}` }
  }

  revalidasiLanding()
}

export type HasilUnggah = { path: string } | { error: string }

const MIME_GAMBAR_DIIZINKAN = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MIME_PDF = 'application/pdf'
const UKURAN_MAKS_GAMBAR = 5 * 1024 * 1024 // 5MB
const UKURAN_MAKS_PDF = 10 * 1024 * 1024 // 10MB

/**
 * Server Action unggah berkas ke bucket Storage `media` — dipakai
 * `FieldMedia` (gambar, lewat `alt`/dimensi yang dikelola di komponen) dan
 * `FieldBerkas` (PDF, lewat `unggah` yang sama).
 *
 * WAJIB memvalidasi jenis MIME dan ukuran DI SINI, bukan cuma lewat
 * `accept` pada `<input type="file">` di klien: Server Action bisa dipanggil
 * langsung tanpa melewati form atau komponen sama sekali (D16 — sama
 * alasannya dengan `simpan` di atas), jadi validasi klien hanyalah
 * kenyamanan UX, bukan penjagaan sungguhan. Klien BISA mengirim `File`
 * apa pun dengan `type`/`name` apa pun yang dikarang — jadi keduanya
 * diperiksa ulang terhadap daftar putih di sini, bukan dipercaya.
 */
export async function unggahBerkas(formData: FormData): Promise<HasilUnggah> {
  const berkas = formData.get('berkas')
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { error: 'Berkas tidak ditemukan.' }
  }

  const jenisGambar = MIME_GAMBAR_DIIZINKAN.has(berkas.type)
  const jenisPdf = berkas.type === MIME_PDF

  if (!jenisGambar && !jenisPdf) {
    return { error: `Jenis berkas "${berkas.type || 'tidak dikenal'}" tidak didukung.` }
  }

  const batasUkuran = jenisPdf ? UKURAN_MAKS_PDF : UKURAN_MAKS_GAMBAR
  if (berkas.size > batasUkuran) {
    return { error: `Ukuran berkas melebihi batas maksimum ${Math.round(batasUkuran / (1024 * 1024))}MB.` }
  }

  // Nama acak (bukan nama asli berkas): nama asli bisa memuat karakter yang
  // tidak sah untuk object path Storage (spasi, unicode, `../`), dan dua
  // pengguna mengunggah berkas bernama sama tidak boleh saling menimpa.
  const ekstensi = berkas.name.includes('.') ? berkas.name.split('.').pop() : undefined
  const namaBerkas = ekstensi ? `${crypto.randomUUID()}.${ekstensi}` : crypto.randomUUID()
  const path = `unggahan/${namaBerkas}`

  const supabase = await createClient()
  const { error } = await supabase.storage.from('media').upload(path, berkas, {
    contentType: berkas.type,
    upsert: false,
  })

  if (error) return { error: `Gagal mengunggah: ${error.message}` }

  return { path }
}
