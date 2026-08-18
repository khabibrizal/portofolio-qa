import type { DefinisiKoleksi } from './tipe'

/**
 * Bentuk field WAJIB cocok dengan `Testimonial` di `src/lib/content/types.ts`.
 *
 * `author_company` dan `photo` sengaja tidak `wajib` — nullable di content
 * types. `photo` (jenis `media`) inilah yang, bersama Task 6, melunasi
 * U-4: foto testimoni sungguhan diunggah lewat admin, bukan lagi
 * placeholder.
 */
export const testimonials: DefinisiKoleksi = {
  slug: 'testimonials',
  tabel: 'testimonials',
  label: 'Testimoni',
  labelTunggal: 'Testimoni',
  kolomJudul: 'author_name',
  field: [
    { nama: 'quote', label: 'Kutipan', jenis: 'terlokalisasi-panjang', wajib: true },
    { nama: 'author_name', label: 'Nama', jenis: 'teks', wajib: true },
    { nama: 'author_role', label: 'Peran', jenis: 'terlokalisasi', wajib: true },
    { nama: 'author_company', label: 'Perusahaan', jenis: 'teks' },
    { nama: 'photo', label: 'Foto', jenis: 'media' },
  ],
}
