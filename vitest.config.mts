import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  // Vitest tidak memuat .env.local ke process.env secara otomatis (beda dengan
  // Next.js saat build/dev). src/lib/env.ts membaca process.env di level modul,
  // jadi env file harus dimuat manual di sini sebelum modul itu diimpor test.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'node',
      include: ['tests/unit/**/*.test.ts'],
    },
  }
})
