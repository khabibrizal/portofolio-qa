import { LOCALES } from '@/lib/i18n/locales'

/**
 * Penanda tunggal bahwa isi situs masih data contoh.
 *
 * Selama `true`, halaman diberi `noindex` DAN `robots.txt` melarang perayapan.
 * Keduanya harus sepakat — situs yang meta-nya `noindex` tapi `robots.txt`-nya
 * mengizinkan (atau sebaliknya) memberi sinyal bertentangan ke mesin pencari.
 *
 * Alasannya: situs sudah tayang publik sementara nama, angka pengalaman,
 * studi kasus, dan testimoni semuanya placeholder. Terindeks berarti klaim
 * palsu beredar atas nama pemiliknya — persis kebalikan dari tujuan portofolio.
 *
 * Melepasnya = ubah satu konstanta ini jadi `false`. Tercatat sebagai U-5 di
 * `docs/superpowers/plans/UTANG-TERBUKA.md`.
 *
 * Nilai default sengaja yang aman: kalau lupa dilepas, akibatnya situs tak
 * muncul di pencarian — merugikan, tapi jauh lebih ringan daripada kebalikannya.
 */
export const KONTEN_MASIH_CONTOH = true

/**
 * Basis URL situs. Dipakai sitemap, yang mensyaratkan URL absolut.
 * Vercel menyediakan `VERCEL_PROJECT_PRODUCTION_URL` tanpa skema.
 */
export function situsUrl(): string {
  // NEXT_PUBLIC_SITUS_URL sengaja MENDAHULUI variabel bawaan Vercel di bawah,
  // yang berisi alamat *.vercel.app — bukan domain sendiri. Kalau yang bawaan
  // menang, sitemap dan og:image menunjuk alamat yang bukan alamat utama,
  // persis kebingungan yang ingin dihindari pengalihan apex -> www.
  const dariEnv = process.env.NEXT_PUBLIC_SITUS_URL
  if (dariEnv) return dariEnv.replace(/\/+$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`

  return 'http://localhost:3000'
}

/** Seluruh URL yang layak diindeks — satu per bahasa (D12). */
export function urlYangDiindeks(): string[] {
  const basis = situsUrl()
  return LOCALES.map((locale) => `${basis}/${locale}`)
}
