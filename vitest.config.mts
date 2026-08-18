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
            // Lihat catatan memori di bawah.
            pool: 'threads',
            maxWorkers: 2,
          },
        },
        {
          extends: true,
          test: {
            name: 'komponen',
            environment: 'jsdom',
            include: ['tests/komponen/**/*.test.tsx'],
            setupFiles: ['./tests/komponen/setup.ts'],
            // Mesin ini punya RAM 7,9 GB dengan tipikal ~1 GB bebas, sementara
            // 12 core logis membuat Vitest men-spawn banyak worker sekaligus.
            // Setiap worker 'forks' adalah proses Node terpisah, dan enam
            // instance jsdom sekaligus melebihi memori yang ada — gejalanya
            // "Failed to start forks worker" atau "Timeout waiting for worker
            // to respond", muncul sporadis dan terlihat seperti flake di test.
            //
            // 'threads' berbagi heap satu proses, dan satu thread menghapus
            // perebutannya sama sekali. Test jsdom di sini cepat begitu termuat;
            // yang mahal adalah start-nya, jadi paralelisme tak banyak menolong.
            pool: 'threads',
            fileParallelism: false,
          },
        },
      ],
    },
  }
})
