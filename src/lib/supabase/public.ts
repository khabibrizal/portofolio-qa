import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Klien anonim TANPA cookie, untuk konten publik landing page.
 *
 * Kenapa terpisah dari `server.ts` yang berbasis cookie: membaca cookie
 * menjadikan sebuah halaman dinamis, sehingga Next.js merendernya ulang pada
 * setiap permintaan dan `revalidate` tidak berlaku. Itu menghapus tulang
 * punggung degradasi kita — kalau database bermasalah, tidak ada render statis
 * terakhir yang bisa disajikan, dan pengunjung melihat halaman rusak.
 *
 * Landing page tidak punya sesi apa pun untuk dibaca: ia selalu anonim dan
 * selalu menampilkan hal yang sama. Jadi ia memakai klien ini, dan halamannya
 * tetap bisa di-prerender.
 *
 * `server.ts` yang berbasis cookie tetap dipakai untuk admin di Fase 2, di mana
 * sesi memang menentukan apa yang boleh dilihat.
 */
export function createPublicClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
