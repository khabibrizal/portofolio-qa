import type { DefinisiKoleksi } from './tipe'

/**
 * Singleton (D21) — satu-satunya baris selalu `id = 1`.
 *
 * Bentuk field WAJIB cocok dengan `Hero` di `src/lib/content/types.ts`.
 * `value` di `key_stats` sengaja jenis `teks`, BUKAN `angka`: isinya
 * berbentuk `4+`, `1.200+`, `70%` — formatnya bagian dari konten dan diatur
 * pemilik (spec §5). Memakai `angka` di sini akan menolak setiap nilai seed
 * yang sudah ada.
 *
 * `cta_secondary` bertipe `Tautan | null` di content types (`cta_primary`
 * tidak) — itu satu-satunya bedanya di sini: `cta_primary` dan anaknya
 * `wajib`, `cta_secondary` dan anaknya tidak (mesin `grup` belum punya cara
 * "mengosongkan" objek sepenuhnya lewat form, jadi tidak wajib adalah yang
 * paling dekat dengan "boleh dikosongkan").
 */
export const hero: DefinisiKoleksi = {
  slug: 'hero',
  tabel: 'hero',
  label: 'Hero',
  labelTunggal: 'Hero',
  kolomJudul: 'full_name',
  singleton: true,
  field: [
    { nama: 'full_name', label: 'Nama Lengkap', jenis: 'teks', wajib: true },
    { nama: 'role_title', label: 'Judul Peran', jenis: 'terlokalisasi', wajib: true },
    { nama: 'short_intro', label: 'Perkenalan Singkat', jenis: 'terlokalisasi', wajib: true },
    {
      nama: 'key_stats',
      label: 'Statistik Utama',
      jenis: 'repeater',
      petunjuk: 'Mis. "4+ Tahun Pengalaman". Format nilai (+, %, titik ribuan) bebas ditentukan sendiri.',
      anak: [
        { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
        { nama: 'value', label: 'Nilai', jenis: 'teks', wajib: true },
      ],
    },
    {
      nama: 'status_checks',
      label: 'Daftar Pemeriksaan Status',
      jenis: 'repeater',
      anak: [
        { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
        { nama: 'status', label: 'Status', jenis: 'teks', wajib: true },
        { nama: 'duration_label', label: 'Label Durasi', jenis: 'teks' },
      ],
    },
    {
      nama: 'cta_primary',
      label: 'CTA Utama',
      jenis: 'grup',
      wajib: true,
      anak: [
        { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
        { nama: 'link', label: 'Tautan', jenis: 'teks', wajib: true },
      ],
    },
    {
      nama: 'cta_secondary',
      label: 'CTA Kedua',
      jenis: 'grup',
      anak: [
        { nama: 'label', label: 'Label', jenis: 'terlokalisasi' },
        { nama: 'link', label: 'Tautan', jenis: 'teks' },
      ],
    },
  ],
}
