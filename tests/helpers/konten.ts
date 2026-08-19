import type { APIRequestContext } from '@playwright/test'
import { headerAnon, urlTabel } from './supabase-anon'

/**
 * Membaca konten yang BENAR-BENAR ada di database, untuk dipakai test sebagai
 * nilai yang diharapkan.
 *
 * KENAPA INI ADA. Versi pertama suite E2E menuliskan nilai seed langsung di
 * dalam asersi: `expect(isi).toContain('kontak@contoh.dev')`,
 * `toHaveValue('4+')`, `'Platform Properti B2C'`. Selama database masih berisi
 * seed, semuanya hijau — dan artinya nyaris tidak ada: yang dibuktikan hanya
 * "seed sama dengan seed".
 *
 * Begitu pemiliknya mengisi kontennya yang asli lewat /admin — tujuan seluruh
 * proyek ini — 33 test jatuh serentak. Tak satu pun menunjukkan cacat pada
 * aplikasi; semuanya cuma menandai bahwa konten sudah berubah. Suite yang
 * berperilaku begitu memaksa pemiliknya memilih antara memperbarui kontennya
 * atau menjaga test-nya tetap hijau, dan pilihan itu tidak semestinya ada.
 *
 * Yang seharusnya dijaga bukan "halaman memuat kalimat tertentu", melainkan
 * "halaman menampilkan apa yang ada di database, dan hanya yang published".
 * Invarian itu tetap benar apa pun isinya.
 *
 * Sengaja lewat REST anonim yang sama seperti `supabase-anon.ts`: yang dibaca
 * di sini adalah tepat apa yang boleh dilihat pengunjung publik, sehingga
 * asersinya tidak pernah menuntut halaman menampilkan sesuatu yang justru
 * tidak boleh dilihat.
 */
export type Dwibahasa = { id: string; en: string }

async function ambil<T>(request: APIRequestContext, tabel: string, query = ''): Promise<T[]> {
  const res = await request.get(urlTabel(tabel, query), { headers: headerAnon() })
  if (!res.ok()) {
    throw new Error(`Gagal membaca ${tabel} sebagai anon: HTTP ${res.status()}`)
  }
  return (await res.json()) as T[]
}

export type SettingsPublik = {
  site_title: Dwibahasa
  meta_description: Dwibahasa
  contact_email: string
  whatsapp_number: string | null
  linkedin_url: string | null
  github_url: string | null
  location: string | null
  languages: Array<{ name: string; level: string }>
  final_cta_headline: Dwibahasa
  copyright_text: Dwibahasa
}

export async function settings(request: APIRequestContext): Promise<SettingsPublik> {
  const baris = await ambil<SettingsPublik>(request, 'site_settings', '?select=*&id=eq.1')
  if (baris.length !== 1) throw new Error('site_settings tidak terbaca sebagai anon')
  return baris[0]
}

export type HeroPublik = {
  full_name: string
  role_title: Dwibahasa
  short_intro: Dwibahasa
  key_stats: Array<{ label: Dwibahasa; value: string }>
  status_checks: Array<{ label: Dwibahasa; status: string }>
}

export async function hero(request: APIRequestContext): Promise<HeroPublik> {
  const baris = await ambil<HeroPublik>(request, 'hero', '?select=*&id=eq.1')
  if (baris.length !== 1) throw new Error('hero tidak terbaca sebagai anon')
  return baris[0]
}

export async function about(
  request: APIRequestContext,
): Promise<{ about_richtext: Dwibahasa; highlight_badges: Array<{ text: Dwibahasa }> } | null> {
  const baris = await ambil<{
    about_richtext: Dwibahasa
    highlight_badges: Array<{ text: Dwibahasa }>
  }>(request, 'about', '?select=*&id=eq.1')
  return baris[0] ?? null
}

/** Semua baris yang terlihat publik dari sebuah koleksi, terurut. */
export function koleksi<T>(
  request: APIRequestContext,
  tabel: string,
  kolom = '*',
): Promise<T[]> {
  return ambil<T>(request, tabel, `?select=${kolom}&order=sort_order.asc`)
}
