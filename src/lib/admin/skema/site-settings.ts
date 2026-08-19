import type { DefinisiKoleksi } from './tipe'

/**
 * Singleton (D21) — satu-satunya baris selalu `id = 1` (lihat CHECK di
 * migrasi `singleton.sql`). Rute admin membuka form ini langsung tanpa
 * daftar (lihat `[koleksi]/page.tsx`).
 *
 * Bentuk field WAJIB cocok dengan `SiteSettings` di `src/lib/content/types.ts`;
 * `wajib` di sini meniru nullability tipe itu satu-satu: field yang di sana
 * bertipe `| null` (og_image, favicon, whatsapp_number, linkedin_url,
 * github_url, resume_pdf) sengaja TIDAK `wajib` — kolomnya di database juga
 * memang boleh kosong.
 */
export const siteSettings: DefinisiKoleksi = {
  slug: 'site-settings',
  tabel: 'site_settings',
  label: 'Pengaturan Situs',
  labelTunggal: 'Pengaturan Situs',
  kolomJudul: 'site_title',
  singleton: true,
  field: [
    { nama: 'site_title', label: 'Judul Situs', jenis: 'terlokalisasi', wajib: true },
    { nama: 'meta_description', label: 'Deskripsi Meta', jenis: 'terlokalisasi', wajib: true },
    {
      nama: 'og_image',
      label: 'Gambar Open Graph',
      jenis: 'media',
      petunjuk: 'Ditampilkan saat tautan situs dibagikan di media sosial.',
    },
    { nama: 'favicon', label: 'Favicon', jenis: 'media' },
    {
      nama: 'availability_status',
      label: 'Status Ketersediaan',
      jenis: 'pilihan',
      wajib: true,
      opsi: [
        { nilai: 'available', label: 'Tersedia' },
        { nilai: 'open', label: 'Terbuka untuk peluang' },
        { nilai: 'unavailable', label: 'Tidak tersedia' },
      ],
    },
    {
      nama: 'location',
      label: 'Domisili',
      jenis: 'teks',
      petunjuk: 'Tampil di blok kontak CV, mis. "Sidoarjo, Indonesia".',
    },
    {
      nama: 'languages',
      label: 'Bahasa',
      jenis: 'repeater',
      anak: [
        { nama: 'name', label: 'Bahasa', jenis: 'teks', wajib: true },
        { nama: 'level', label: 'Tingkat', jenis: 'teks', wajib: true },
      ],
    },
    { nama: 'contact_email', label: 'Email Kontak', jenis: 'teks', wajib: true },
    { nama: 'whatsapp_number', label: 'Nomor WhatsApp', jenis: 'teks' },
    { nama: 'linkedin_url', label: 'URL LinkedIn', jenis: 'url' },
    { nama: 'github_url', label: 'URL GitHub', jenis: 'url' },
    { nama: 'resume_pdf', label: 'Berkas CV (PDF)', jenis: 'berkas' },
    { nama: 'final_cta_headline', label: 'Judul CTA Penutup', jenis: 'terlokalisasi', wajib: true },
    { nama: 'final_cta_subtext', label: 'Subteks CTA Penutup', jenis: 'terlokalisasi', wajib: true },
    { nama: 'copyright_text', label: 'Teks Hak Cipta', jenis: 'terlokalisasi', wajib: true },
  ],
}
