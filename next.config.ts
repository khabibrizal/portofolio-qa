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

const nextConfig: NextConfig = {
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
