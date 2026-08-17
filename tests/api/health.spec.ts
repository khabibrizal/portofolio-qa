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
  const cacheControl = response.headers()['cache-control'] ?? ''
  expect(cacheControl).toContain('no-store')
})
