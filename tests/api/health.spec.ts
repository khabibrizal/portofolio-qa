import { expect, test } from '@playwright/test'

test('GET /api/health mengembalikan 200 dengan status ok', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body.status).toBe('ok')
  expect(typeof body.timestamp).toBe('string')
  expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false)
})

test('GET /api/health tidak pernah di-cache', async ({ request }) => {
  const response = await request.get('/api/health')

  // Status diperiksa lebih dulu dengan sengaja: Next.js menyertakan `no-store`
  // pada respons 404 bawaannya, sehingga tanpa baris ini test tetap hijau
  // meski endpoint-nya tidak pernah ada — lulus karena alasan yang salah.
  expect(response.status()).toBe(200)

  const cacheControl = response.headers()['cache-control'] ?? ''
  expect(cacheControl).toContain('no-store')
})
