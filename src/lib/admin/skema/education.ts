import type { DefinisiKoleksi } from './tipe'

/**
 * Bentuk field WAJIB cocok dengan `Education` di `src/lib/content/types.ts`.
 *
 * `year` dibatasi sama seperti `certifications.year` — lihat catatan di
 * `certifications.ts`: CHECK constraint 1990-2100 sudah ada di database
 * sejak Fase 1a, dan `min`/`max` di sini yang membuat pelanggarannya
 * tertangkap di field, bukan di layar error database.
 */
export const education: DefinisiKoleksi = {
  slug: 'education',
  tabel: 'education',
  label: 'Edukasi',
  labelTunggal: 'Edukasi',
  kolomJudul: 'institution',
  field: [
    { nama: 'institution', label: 'Institusi', jenis: 'teks', wajib: true },
    { nama: 'degree', label: 'Gelar', jenis: 'terlokalisasi', wajib: true },
    { nama: 'year', label: 'Tahun', jenis: 'angka', wajib: true, min: 1990, max: 2100 },
  ],
}
