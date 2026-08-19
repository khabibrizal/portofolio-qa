import type { NextConfig } from "next";

/**
 * Domain utama adalah www.khabibfahrurrizal.web.id; apex dialihkan ke sana.
 *
 * Tanpa pengalihan, kedua alamat menyajikan konten identik dan mesin pencari
 * harus menebak mana yang utama — tebakannya belum tentu sama dengan yang
 * diinginkan pemilik, dan bobot tautan terbelah dua.
 *
 * Ditaruh di sini, bukan di setelan dashboard Vercel, supaya tercatat di repo,
 * bisa ditinjau, dan bisa diuji. Biayanya satu invocation per pengalihan —
 * dapat diabaikan untuk portofolio, dan tetap berlaku andai suatu saat pindah
 * dari Vercel.
 */
const DOMAIN_UTAMA = 'www.khabibfahrurrizal.web.id';
const DOMAIN_APEX = 'khabibfahrurrizal.web.id';

/**
 * Host Supabase Storage yang boleh dioptimasi `next/image`.
 *
 * Diturunkan dari NEXT_PUBLIC_SUPABASE_URL, BUKAN dituliskan sebagai wildcard
 * `*.supabase.co`. Wildcard akan mengizinkan proyek Supabase milik siapa pun
 * dioptimasi lewat endpoint ini — artinya orang lain bisa memakai kuota
 * pengoptimalan gambar akun ini untuk gambar mereka.
 *
 * Kalau env-nya tidak ada saat build, daftar ini kosong dan `next/image` akan
 * MENOLAK gambar remote dengan galat yang jelas — jauh lebih baik daripada
 * diam-diam melebarkan izin.
 */
function hostMedia(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const HOST_MEDIA = hostMedia();

const nextConfig: NextConfig = {
  /**
   * Pengoptimalan gambar remote.
   *
   * Sebelum ini kedua <Image> di landing memakai prop `unoptimized`, sehingga
   * berkasnya disajikan MENTAH dari Supabase Storage: foto profil terukur 183 KB
   * JPEG untuk kotak yang lebarnya sekitar 400px. Itu lebih berat daripada
   * seluruh CSS dan hampir setengah dari seluruh JavaScript halaman ini —
   * ditukar hanya demi menghindari beberapa baris konfigurasi di bawah.
   *
   * Dengan ini aktif, Next menyajikan AVIF/WebP pada lebar yang benar-benar
   * dibutuhkan tiap breakpoint.
   */
  images: HOST_MEDIA
    ? {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: HOST_MEDIA,
            // Dipersempit ke bucket publik saja — bukan seluruh host.
            pathname: '/storage/v1/object/public/**',
          },
        ],
      }
    : undefined,

  async redirects() {
    return [
      {
        source: '/:jalur*',
        has: [{ type: 'host', value: DOMAIN_APEX }],
        destination: `https://${DOMAIN_UTAMA}/:jalur*`,
        // 308: permanen dan mempertahankan metode. Mesin pencari memindahkan
        // bobotnya ke alamat tujuan, yang justru tujuan pengalihan ini.
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
