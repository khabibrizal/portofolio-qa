import { LOCALES, type Locale } from './locales'

/**
 * Menyesuaikan tautan internal dengan bahasa yang sedang dibaca.
 *
 * Tautan CTA disimpan di database sebagai satu string, sementara halamannya
 * ada dua — `/id/...` dan `/en/...`. Tanpa penyesuaian ini, pemilik harus
 * memilih salah satu bahasa saat mengisi form, dan pembaca yang membuka versi
 * Inggris akan dilempar ke halaman berbahasa Indonesia.
 *
 * Aturannya sempit dan sengaja begitu:
 * - Tautan absolut (`https://`, `mailto:`, `tel:`) dibiarkan apa adanya.
 * - Jangkar (`#kontak`) dibiarkan — ia menunjuk ke halaman yang sedang dibuka.
 * - Tautan internal yang SUDAH berawalan bahasa dibiarkan, supaya pemilik
 *   tetap bisa menunjuk satu bahasa tertentu bila memang disengaja.
 * - Sisanya (`/cv`, `/tentang`) diberi awalan bahasa yang sedang aktif.
 */
export function tautanLokal(link: string, locale: Locale): string {
  if (!link) return link
  if (!link.startsWith('/')) return link

  const segmenPertama = link.split('/')[1]
  if ((LOCALES as readonly string[]).includes(segmenPertama)) return link

  return `/${locale}${link}`
}
