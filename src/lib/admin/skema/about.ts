import type { DefinisiKoleksi } from './tipe'

/**
 * Singleton (D21) — satu-satunya baris selalu `id = 1`.
 *
 * Bentuk field WAJIB cocok dengan `About` di `src/lib/content/types.ts`.
 * `about_richtext` sengaja `terlokalisasi-panjang`, bukan editor rich text
 * (D18 DIBATALKAN) — `About.tsx` merendernya sebagai teks biasa lewat
 * `teks()`, dan menambah `dangerouslySetInnerHTML` di sini akan membuka
 * kelas kerentanan XSS yang sekarang tidak ada sama sekali.
 */
export const about: DefinisiKoleksi = {
  slug: 'about',
  tabel: 'about',
  label: 'Tentang Saya',
  labelTunggal: 'Tentang Saya',
  kolomJudul: 'about_richtext',
  singleton: true,
  field: [
    { nama: 'profile_photo', label: 'Foto Profil', jenis: 'media' },
    { nama: 'about_richtext', label: 'Tentang Saya', jenis: 'terlokalisasi-panjang', wajib: true },
    {
      nama: 'highlight_badges',
      label: 'Lencana Sorotan',
      jenis: 'repeater',
      anak: [{ nama: 'text', label: 'Teks', jenis: 'terlokalisasi', wajib: true }],
    },
  ],
}
