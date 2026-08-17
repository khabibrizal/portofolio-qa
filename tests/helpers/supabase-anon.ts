/**
 * Klien REST anonim — sengaja memakai HTTP mentah, bukan supabase-js,
 * agar test menguji apa yang benar-benar dijawab server, bukan apa yang
 * disimpulkan library.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export function headerAnon(): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export function urlTabel(tabel: string, query = ''): string {
  return `${SUPABASE_URL}/rest/v1/${tabel}${query}`
}
