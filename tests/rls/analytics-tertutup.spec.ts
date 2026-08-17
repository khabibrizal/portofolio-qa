import { expect, test } from '@playwright/test'
import { headerAnon, urlTabel } from '../helpers/supabase-anon'

test('analytics_events tidak bisa dibaca klien anonim', async ({ request }) => {
  const res = await request.get(urlTabel('analytics_events', '?select=id'), {
    headers: headerAnon(),
  })

  if (res.status() === 200) {
    // RLS tanpa kebijakan SELECT untuk anon menghasilkan himpunan kosong,
    // bukan error. Kosong = tertutup; berisi = bocor.
    expect(await res.json()).toEqual([])
  } else {
    expect(res.status()).toBeGreaterThanOrEqual(400)
  }
})

test('analytics_events tidak bisa ditulis klien anonim', async ({ request }) => {
  const res = await request.post(urlTabel('analytics_events'), {
    headers: headerAnon(),
    data: { event_type: 'cta_click', locale: 'id', path: '/id' },
  })
  expect(res.status()).toBeGreaterThanOrEqual(400)
})
