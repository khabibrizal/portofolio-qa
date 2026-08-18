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
      // Dua environment lewat `test.projects` (Vitest 4) — bukan
      // `environmentMatchGlobs`, yang sudah tidak ada sama sekali di tipe
      // `InlineConfig` node_modules/vitest (deprecated sejak v3, dibuang di
      // v4; lihat node_modules/vitest/dist/chunks/reporters.d.*.d.ts, yang
      // masih mendefinisikan `projects?: TestProjectConfiguration[]`).
      // `extends: true` mewarisi `resolve.alias` di atas ke tiap project,
      // jadi alias `@/...` tetap jalan tanpa didefinisikan ulang.
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['tests/unit/**/*.test.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'komponen',
            environment: 'jsdom',
            include: ['tests/komponen/**/*.test.tsx'],
            setupFiles: ['./tests/komponen/setup.ts'],
          },
        },
      ],
    },
  }
})
