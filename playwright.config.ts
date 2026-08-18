import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

// Playwright tidak memuat .env.local ke process.env secara otomatis (beda dengan
// Next.js saat build/dev). Suite rls/ bicara langsung ke REST API Supabase dari
// proses test ini sendiri (bukan lewat webServer Next), jadi env harus dimuat
// manual di sini — pola yang sama dipakai vitest.config.mts.
Object.assign(process.env, loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), ''))

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'api/**/*.spec.ts', 'rls/**/*.spec.ts'],
  // Sengaja TIDAK paralel. Proyek ini memakai satu database untuk semua —
  // pengembangan, test, dan produksi (spec §9). Test yang menulis (siklus
  // penerbitan admin) karena itu berbagi keadaan dengan test yang membaca
  // (landing, daftar entri), dan menjalankannya berbarengan menghasilkan
  // kegagalan yang tak ada hubungannya dengan kode.
  //
  // Bukan sekadar soal kebenaran: diukur di mesin ini, satu worker selesai
  // ~35 detik sementara multi-worker 5,2 menit karena saling berebut server
  // dan database. Jadi paralelisme di sini merugikan dua-duanya.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        // Build bersih terukur ~82 detik di mesin dev, tapi bisa 2x lipat saat
        // mesin sibuk — dan ambang lama (180s) sudah pernah membuat suite gagal
        // karena kehabisan waktu, bukan karena ada yang salah dengan kodenya.
        // Kegagalan seperti itu paling merugikan: ia mengajari orang untuk
        // meragukan suite yang sebenarnya benar.
        timeout: 420_000,
      },
})
