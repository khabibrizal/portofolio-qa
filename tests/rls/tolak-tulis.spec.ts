import { expect, test } from '@playwright/test'
import { headerAnon, urlTabel } from '../helpers/supabase-anon'

const SEMUA_KONTEN = [
  'site_settings', 'hero', 'about', 'tools', 'skill_categories',
  'case_studies', 'lab_scenarios', 'experiences', 'certifications',
  'education', 'testimonials',
] as const

test.describe('RLS — klien anonim tidak boleh menulis', () => {
  for (const tabel of SEMUA_KONTEN) {
    test(`${tabel}: INSERT anon ditolak`, async ({ request }) => {
      const res = await request.post(urlTabel(tabel), {
        headers: headerAnon(),
        data: { sort_order: 999 },
      })
      // 401/403 = ditolak RLS, 400 = ditolak sebelum sampai kebijakan.
      // Yang penting: TIDAK BOLEH 2xx.
      expect(res.status(), `${tabel} menerima INSERT anonim`).toBeGreaterThanOrEqual(400)
    })

    test(`${tabel}: DELETE massal anon tidak menghapus apa pun`, async ({ request }) => {
      const sebelum = await request.get(urlTabel(tabel, '?select=id'), { headers: headerAnon() })
      const jumlahSebelum = ((await sebelum.json()) as unknown[]).length

      await request.delete(urlTabel(tabel, '?id=not.is.null'), { headers: headerAnon() })

      const sesudah = await request.get(urlTabel(tabel, '?select=id'), { headers: headerAnon() })
      const jumlahSesudah = ((await sesudah.json()) as unknown[]).length

      expect(jumlahSesudah, `${tabel} kehilangan baris setelah DELETE anonim`).toBe(jumlahSebelum)
    })
  }
})
