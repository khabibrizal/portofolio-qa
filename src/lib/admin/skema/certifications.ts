import type { DefinisiKoleksi } from './tipe'

/**
 * Bentuk field WAJIB cocok dengan `Certification` di `src/lib/content/types.ts`.
 *
 * `year` dibatasi `min: 1990`/`max: 2100` — batas ini BUKAN hiasan: migrasi
 * Fase 1a memasang `CHECK (year between 1990 and 2100)` di kolom ini.
 * Tanpa `min`/`max` di sini, tahun di luar rentang lolos validasi form lalu
 * ditolak database, dan pengisi form melihat layar error alih-alih pesan
 * di field `year` (lihat test khusus di `admin-koleksi-sederhana.spec.ts`).
 *
 * `credential_url` sengaja tidak `wajib` — nullable di content types.
 */
export const certifications: DefinisiKoleksi = {
  slug: 'certifications',
  tabel: 'certifications',
  label: 'Sertifikasi',
  labelTunggal: 'Sertifikasi',
  kolomJudul: 'name',
  field: [
    { nama: 'name', label: 'Nama Sertifikasi', jenis: 'teks', wajib: true },
    { nama: 'issuer', label: 'Penerbit', jenis: 'teks', wajib: true },
    { nama: 'year', label: 'Tahun', jenis: 'angka', wajib: true, min: 1990, max: 2100 },
    { nama: 'credential_url', label: 'URL Kredensial', jenis: 'url' },
  ],
}
