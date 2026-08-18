import { env } from '@/lib/env'

/**
 * Membangun URL publik sebuah berkas di bucket `media` dari object path-nya.
 *
 * Keputusan D19: yang disimpan di database adalah **object path**
 * (`about/foto-profil.png`), bukan URL penuh. Menyimpan URL penuh berarti
 * menanam project ref Supabase ke dalam setiap baris konten — dan suatu saat
 * pindah proyek berubah dari mengganti satu konstanta jadi migrasi data.
 *
 * Menerima `null` supaya pemanggil tidak perlu menjaga sendiri; field media
 * di skema memang boleh kosong.
 */
export function urlMedia(path: string | null | undefined): string | null {
  if (!path) return null

  // Path yang sudah berupa URL penuh dibiarkan apa adanya. Ini bukan
  // kelonggaran: seed dan data lama bisa memuat URL penuh, dan memaksanya
  // jadi ganda (`.../public/media/https://...`) hanya menghasilkan gambar
  // rusak yang sulit dilacak sebabnya.
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const bersih = path.replace(/^\/+/, '')
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${bersih}`
}
