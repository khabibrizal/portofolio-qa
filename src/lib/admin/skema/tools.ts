import type { DefinisiKoleksi } from './tipe'

/**
 * Bentuk field WAJIB cocok dengan `Tool` di `src/lib/content/types.ts`.
 * `logo` sengaja tidak `wajib` — nullable di content types, dan koleksi ini
 * yang memperkenalkan jenis field `media` pada koleksi BIASA (bukan
 * singleton): berbeda dari `site_settings.og_image`/`favicon` dan
 * `about.profile_photo` yang sudah lebih dulu memakainya di Task 3, di sini
 * `media` hidup berdampingan dengan badge draft/terbit dan tombol
 * terbitkan/hapus milik koleksi biasa.
 */
export const tools: DefinisiKoleksi = {
  slug: 'tools',
  tabel: 'tools',
  label: 'Tools & Platform',
  labelTunggal: 'Tool',
  kolomJudul: 'name',
  field: [
    { nama: 'name', label: 'Nama', jenis: 'teks', wajib: true },
    { nama: 'logo', label: 'Logo', jenis: 'media' },
  ],
}
