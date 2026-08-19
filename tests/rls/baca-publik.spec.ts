import { expect, test } from '@playwright/test'
import { headerAnon, urlTabel } from '../helpers/supabase-anon'

const KOLEKSI = [
  'tools', 'skill_categories', 'case_studies', 'lab_scenarios',
  'experiences', 'certifications', 'education', 'testimonials',
] as const

test.describe('RLS — pembacaan oleh klien anonim', () => {
  for (const tabel of KOLEKSI) {
    test(`${tabel}: anon hanya menerima baris published`, async ({ request }) => {
      const res = await request.get(urlTabel(tabel, '?select=status'), { headers: headerAnon() })
      expect(res.status()).toBe(200)

      const baris = (await res.json()) as Array<{ status: string }>

      // Yang diuji: TIDAK ADA baris non-published yang lolos ke klien anonim.
      //
      // Versi sebelumnya juga menuntut `baris.length > 0` dengan alasan "harus
      // punya data seed". Tuntutan itu keliru dua kali. Ia mencampur dua hal
      // berbeda — apakah kebijakan RLS benar, dan apakah kebetulan ada data —
      // lalu melaporkan koleksi kosong sebagai kegagalan keamanan. Koleksi yang
      // seluruh barisnya masih draft (mis. sertifikasi yang belum diisi
      // pemiliknya) justru keadaan paling aman yang mungkin: anon tidak
      // menerima apa pun. Menggagalkannya menekan pemilik untuk menerbitkan
      // sesuatu — apa saja — hanya demi menghijaukan test keamanan.
      expect(
        baris.filter((b) => b.status !== 'published'),
        `${tabel}: baris non-published lolos ke klien anonim`,
      ).toEqual([])
    })

    test(`${tabel}: filter status=draft mengembalikan nol baris`, async ({ request }) => {
      const res = await request.get(urlTabel(tabel, '?select=id&status=eq.draft'), {
        headers: headerAnon(),
      })
      expect(res.status()).toBe(200)
      expect(await res.json()).toEqual([])
    })
  }

  for (const tabel of ['site_settings', 'hero', 'about'] as const) {
    test(`${tabel}: singleton bisa dibaca publik`, async ({ request }) => {
      const res = await request.get(urlTabel(tabel, '?select=id'), { headers: headerAnon() })
      expect(res.status()).toBe(200)
      expect((await res.json()).length).toBe(1)
    })
  }
})
