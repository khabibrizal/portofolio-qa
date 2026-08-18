import type { APIRequestContext } from '@playwright/test'
import { SUPABASE_KEY, SUPABASE_URL, urlTabel } from './supabase-anon'

export { urlTabel }

/**
 * Sesi TERAUTENTIKASI sebagai pemilik (bukan anon) untuk verifikasi database
 * langsung di `admin-terbit.spec.ts` — menghitung baris sebelum/sesudah dan
 * membersihkan sisa entri `ZZ-UJI-`, di LUAR jalur UI/form.
 *
 * Sengaja HTTP mentah (`request` bawaan Playwright), BUKAN `@supabase/supabase-js`:
 * paket itu selalu menginisialisasi `realtime-js` yang butuh WebSocket native
 * di konstruktornya, dan Node 20 (versi yang dipakai menjalankan Playwright di
 * lingkungan ini) tidak menyediakannya — `createClient()` melempar
 * "Node.js detected but native WebSocket not found" walau realtime tidak
 * pernah dipakai. Pola ini sama seperti `supabase-anon.ts`.
 *
 * Sesi terpisah ini TIDAK mencabut sesi login browser yang sedang dipakai
 * `page` di test yang sama — dibuktikan lewat eksplorasi manual sebelum
 * berkas ini ditulis (dua sign-in bersamaan untuk akun yang sama, browser
 * tetap logged-in setelahnya). Kalau ternyata ini berubah di masa depan
 * (mis. Supabase mengaktifkan single-session), test yang memakai helper ini
 * akan gagal dengan jelas lewat redirect ke /admin/login, bukan diam-diam.
 */
export async function tokenPemilik(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    data: { email, password },
  })

  if (!res.ok()) {
    throw new Error(`Gagal masuk sebagai pemilik untuk verifikasi DB: HTTP ${res.status()}`)
  }

  const body = (await res.json()) as { access_token?: string }
  if (!body.access_token) throw new Error('Respons sign-in tidak berisi access_token')
  return body.access_token
}

export function headerPemilik(token: string): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}
