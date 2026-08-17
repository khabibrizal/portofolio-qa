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
      expect(baris.length, `${tabel} harus punya data seed`).toBeGreaterThan(0)
      expect(baris.every((b) => b.status === 'published')).toBe(true)
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
