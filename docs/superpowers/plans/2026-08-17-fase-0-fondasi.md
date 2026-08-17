# Fase 0 — Fondasi Proyek Portofolio QA

> **Untuk pekerja agentik:** Gunakan skill `superpowers:subagent-driven-development` (disarankan) atau `superpowers:executing-plans` untuk mengeksekusi rencana ini task demi task. Langkah memakai sintaks checkbox (`- [ ]`) untuk pelacakan.

**Goal:** Menghasilkan repo Next.js yang ter-deploy hidup di Vercel, terhubung ke dua proyek Supabase, dengan harness test (Vitest + Playwright) dan CI GitHub Actions yang hijau — fondasi tempat Fase 1 dibangun.

**Architecture:** Satu repo Next.js 16 App Router + TypeScript, styling Tailwind v4 berbasis `@theme` dengan token warna/tipografi diambil dari mockup yang sudah disetujui. Tanpa Docker dan tanpa Supabase lokal (mesin dev kekurangan disk) — dua proyek Supabase cloud dipakai sebagai `dev` dan `prod`. Test dipisah dua lapis sejak awal: Vitest untuk logika murni, Playwright untuk API & E2E terhadap aplikasi yang benar-benar dibangun.

**Tech Stack:** Next.js 16.3.x, React 19, TypeScript, Tailwind CSS 4.3.x, Supabase (`@supabase/supabase-js` 2.112.x, `@supabase/ssr` 0.12.x), Zod 4.x, Vitest 4.x, Playwright 1.62.x, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-17-portofolio-qa-design.md`

---

## Ruang lingkup fase ini

**Termasuk:** scaffold, repo GitHub publik, token desain, harness Vitest, harness Playwright, endpoint `/api/health`, klien Supabase + validasi env, workflow CI, deploy produksi Vercel, badge CI di README.

**Tidak termasuk (milik Fase 1):** tabel apa pun, RLS, seed, komponen section landing, i18n, pemeriksaan DB di dalam `/api/health`.

**Definition of done Fase 0:**
1. `https://<domain-vercel>/api/health` mengembalikan `200` dengan `{"status":"ok"}`
2. Workflow CI hijau di GitHub, badge-nya tayang di README
3. `npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e` hijau di mesin lokal
4. Dua proyek Supabase ada, kredensialnya tersimpan di `.env.local`, di GitHub Secrets, dan di Vercel

---

## Struktur file yang dihasilkan fase ini

```
D:\portofolio-qa\
├─ .github/workflows/ci.yml           # verifikasi: typecheck, lint, unit, e2e
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                   # root layout: 3 variabel font
│  │  ├─ page.tsx                     # placeholder, diganti di Fase 1
│  │  ├─ globals.css                  # token desain (@theme) — sumber kebenaran warna/font
│  │  └─ api/health/route.ts          # health-check
│  └─ lib/
│     ├─ env.ts                       # skema Zod untuk environment variable
│     └─ supabase/server.ts           # klien Supabase sisi server
├─ tests/
│  ├─ unit/                           # Vitest — tanpa browser, tanpa DB
│  │  ├─ sanity.test.ts
│  │  ├─ design-tokens.test.ts
│  │  └─ env.test.ts
│  ├─ api/health.spec.ts              # Playwright request context
│  └─ e2e/smoke.spec.ts               # Playwright browser
├─ playwright.config.ts
├─ vitest.config.ts
├─ .env.example                       # di-commit
├─ .env.local                         # TIDAK di-commit
└─ README.md                          # badge CI
```

**Batas tanggung jawab.** `globals.css` adalah satu-satunya tempat token warna & font didefinisikan — tidak ada warna hex yang ditulis di komponen. `src/lib/env.ts` adalah satu-satunya tempat `process.env` dibaca; modul lain mengimpor `env` dari sana, sehingga variabel yang hilang gagal di satu tempat dengan pesan jelas, bukan sebagai `undefined` yang menjalar.

---

## Task 1: Scaffold Next.js ke dalam repo yang sudah ada

Repo `D:\portofolio-qa` sudah punya `.git` dan `docs/`. `create-next-app` menolak menulis ke direktori yang berisi folder tak dikenalnya, jadi kita scaffold ke direktori sementara lalu memindahkan isinya.

**Files:**
- Create: seluruh scaffold Next.js di `D:\portofolio-qa\`
- Modify: `D:\portofolio-qa\package.json` (blok `scripts`)

- [ ] **Step 1: Scaffold ke direktori sementara**

```powershell
npx --yes create-next-app@latest D:\portofolio-qa-scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Harapan: selesai tanpa error, `D:\portofolio-qa-scaffold\package.json` ada.

- [ ] **Step 2: Pindahkan isi scaffold ke repo, buang scaffold**

Filter `.git` penting — scaffold membuat repo git sendiri yang tidak boleh menimpa milik kita.

```powershell
Get-ChildItem -Path "D:\portofolio-qa-scaffold" -Force | Where-Object { $_.Name -ne '.git' } | Move-Item -Destination "D:\portofolio-qa"
Remove-Item -Recurse -Force "D:\portofolio-qa-scaffold"
Get-ChildItem "D:\portofolio-qa"
```

Harapan: `D:\portofolio-qa` berisi `src`, `public`, `package.json`, `tsconfig.json`, `docs`, `.gitignore`.

- [ ] **Step 3: Tetapkan blok `scripts` secara eksplisit**

Jangan mengandalkan apa yang dihasilkan scaffold — `next lint` sudah dihapus di Next.js 16, jadi kita tetapkan sendiri. Ganti blok `"scripts"` di `D:\portofolio-qa\package.json` menjadi persis:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test": "npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e"
  },
```

`test:unit` dan `test:e2e` merujuk alat yang baru dipasang di Task 3 dan Task 5. Itu disengaja — daftar perintah sudah final sejak awal sehingga CI di Task 8 tidak perlu diubah lagi.

- [ ] **Step 4: Verifikasi build berhasil**

```powershell
cd D:\portofolio-qa
npm run build
```

Harapan: build selesai dengan `✓ Compiled successfully`. Kalau gagal karena versi Node, periksa `node -v` — butuh ≥ 20.

- [ ] **Step 5: Verifikasi `.env.local` sudah diabaikan git**

```powershell
Select-String -Path "D:\portofolio-qa\.gitignore" -Pattern "env"
```

Harapan: ada baris `.env*` atau `.env*.local`. Kalau tidak ada, tambahkan `.env*.local` ke `.gitignore`. Ini diperiksa sekarang, bukan nanti — kredensial Supabase masuk di Task 7 dan tidak boleh pernah tersentuh git sekali pun.

- [ ] **Step 6: Commit**

```powershell
cd D:\portofolio-qa
git add -A
git commit -m "chore: scaffold Next.js 16 + TypeScript + Tailwind v4"
```

---

## Task 2: Repo GitHub publik

Repo harus **publik** karena badge CI di footer situs harus bisa diverifikasi siapa pun (spec §9). CI juga baru bisa jalan setelah ada remote.

**Files:** tidak ada perubahan file; hanya remote git.

- [ ] **Step 1: Pastikan `gh` terautentikasi**

```powershell
gh auth status
```

Harapan: `Logged in to github.com`. Kalau belum, jalankan `gh auth login` dan ikuti prosesnya di browser.

- [ ] **Step 2: Buat repo publik dan push**

```powershell
cd D:\portofolio-qa
gh repo create portofolio-qa --public --source . --remote origin --push
```

Harapan: URL repo tercetak, dan `git remote -v` menampilkan `origin`.

- [ ] **Step 3: Verifikasi branch default**

```powershell
git branch --show-current
```

Harapan: `master`. Catat hasilnya — nilai ini dipakai persis di `ci.yml` pada Task 8. Kalau hasilnya `main`, pakai `main` di sana.

---

## Task 3: Harness Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/unit/sanity.test.ts`

- [ ] **Step 1: Tulis test yang gagal**

Buat `tests/unit/sanity.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('harness vitest', () => {
  it('menjalankan test dan mengevaluasi assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```powershell
cd D:\portofolio-qa
npm run test:unit
```

Harapan: GAGAL dengan pesan bahwa `vitest` tidak dikenali — alatnya memang belum ada.

- [ ] **Step 3: Pasang Vitest dan buat konfigurasinya**

```powershell
npm i -D vitest@^4
```

Buat `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
})
```

`include` dibatasi ke `tests/unit/**` supaya Vitest tidak pernah mencoba menjalankan spec Playwright — dua runner yang saling memakan file adalah sumber kebingungan yang mahal.

- [ ] **Step 4: Jalankan untuk memastikan lulus**

```powershell
npm run test:unit
```

Harapan: `1 passed`.

- [ ] **Step 5: Commit**

```powershell
git add vitest.config.ts tests/unit/sanity.test.ts package.json package-lock.json
git commit -m "test: pasang harness Vitest untuk test unit"
```

---

## Task 4: Token desain dari mockup

Token warna dan font dari mockup yang sudah disetujui dipindahkan ke `globals.css` sebagai `@theme` Tailwind v4, dan dikunci oleh test.

Test ini menjaga hal yang nyata: kalau suatu saat ada token terhapus atau nilainya bergeser, seluruh halaman ikut bergeser diam-diam. Test membuatnya berisik.

**Files:**
- Create: `tests/unit/design-tokens.test.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Tulis test yang gagal**

Buat `tests/unit/design-tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8')

const WARNA_WAJIB: Record<string, string> = {
  '--color-bg': '#f6f7f9',
  '--color-surface': '#ffffff',
  '--color-ink': '#12181f',
  '--color-ink-soft': '#54606d',
  '--color-ink-faint': '#8a93a0',
  '--color-primary': '#1e3a5f',
  '--color-primary-dark': '#122741',
  '--color-primary-tint': '#eaf0f6',
  '--color-pass': '#1e8a5f',
  '--color-pass-bg': '#e7f4ee',
  '--color-critical': '#b23a2e',
  '--color-major': '#b9812b',
  '--color-border': '#e3e7ed',
}

const FONT_WAJIB = ['--font-display', '--font-body', '--font-mono']

describe('token desain dari mockup', () => {
  it('mendefinisikan setiap token warna dengan nilai yang tepat', () => {
    for (const [token, nilai] of Object.entries(WARNA_WAJIB)) {
      const cocok = css.match(new RegExp(`${token}\\s*:\\s*([^;]+);`))
      expect(cocok, `token ${token} tidak ditemukan di globals.css`).not.toBeNull()
      expect(cocok![1].trim().toLowerCase(), `nilai ${token} tidak sesuai mockup`).toBe(nilai)
    }
  })

  it('mendefinisikan tiga keluarga font', () => {
    for (const token of FONT_WAJIB) {
      expect(css, `token ${token} tidak ditemukan`).toContain(token)
    }
  })
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```powershell
npm run test:unit
```

Harapan: GAGAL — `token --color-bg tidak ditemukan di globals.css`.

- [ ] **Step 3: Tulis token ke `globals.css`**

Ganti **seluruh isi** `src/app/globals.css` dengan:

```css
@import "tailwindcss";

@theme {
  --color-bg: #f6f7f9;
  --color-surface: #ffffff;
  --color-ink: #12181f;
  --color-ink-soft: #54606d;
  --color-ink-faint: #8a93a0;
  --color-primary: #1e3a5f;
  --color-primary-dark: #122741;
  --color-primary-tint: #eaf0f6;
  --color-pass: #1e8a5f;
  --color-pass-bg: #e7f4ee;
  --color-critical: #b23a2e;
  --color-major: #b9812b;
  --color-border: #e3e7ed;

  --font-display: var(--font-space-grotesk), ui-sans-serif, sans-serif;
  --font-body: var(--font-ibm-plex-sans), ui-sans-serif, sans-serif;
  --font-mono: var(--font-ibm-plex-mono), ui-monospace, monospace;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Muat font lewat `next/font`, bukan CDN**

Ganti **seluruh isi** `src/app/layout.tsx` dengan:

```tsx
import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Portofolio QA Engineer',
  description: 'Portofolio QA Engineer — manual & automation testing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

Mockup memuat font dari Google Fonts CDN. Di sini `next/font` meng-host font itu sendiri: satu permintaan jaringan pihak ketiga hilang, tidak ada layout shift saat font tiba, dan tidak ada kebocoran informasi pengunjung ke Google. Ini juga yang membuat budget performa di Fase 4 realistis untuk dicapai.

- [ ] **Step 5: Jalankan test dan build**

```powershell
npm run test:unit
npm run build
```

Harapan: test `2 passed`; build sukses.

- [ ] **Step 6: Commit**

```powershell
git add src/app/globals.css src/app/layout.tsx tests/unit/design-tokens.test.ts
git commit -m "feat: token desain dari mockup + pemuatan font self-hosted"
```

---

## Task 5: Harness Playwright

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Tulis test yang gagal**

Buat `tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('halaman utama merespons 200 dan menetapkan bahasa dokumen', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})
```

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```powershell
npm run test:e2e
```

Harapan: GAGAL — `playwright` tidak dikenali.

- [ ] **Step 3: Pasang Playwright**

Disk mesin ini sempit (C: ~18 GB). Browser Chromium ~150 MB; arahkan ke drive E: yang paling lega:

```powershell
[Environment]::SetEnvironmentVariable('PLAYWRIGHT_BROWSERS_PATH','E:\pw-browsers','User')
$env:PLAYWRIGHT_BROWSERS_PATH = 'E:\pw-browsers'
npm i -D @playwright/test@^1.62
npx playwright install chromium
```

Harapan: unduhan selesai, browser tersimpan di `E:\pw-browsers`.

- [ ] **Step 4: Buat konfigurasi Playwright**

Buat `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'api/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
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
        timeout: 180_000,
      },
})
```

Dua keputusan yang perlu dipahami:

`webServer` memakai `build && start`, bukan `dev`. Test harus menembak bundel produksi — itu yang benar-benar dilihat pengunjung. Server dev punya perilaku berbeda (tanpa optimasi, tanpa caching) dan test yang lulus di sana bisa gagal di produksi.

`PLAYWRIGHT_BASE_URL` mematikan `webServer`. Itu saklar yang dipakai `nightly.yml` di Fase 4 untuk menembak produksi tanpa membangun apa pun.

- [ ] **Step 5: Abaikan keluaran Playwright dari git**

Tambahkan ke akhir `.gitignore`:

```gitignore

# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 6: Jalankan test untuk memastikan lulus**

```powershell
npm run test:e2e
```

Harapan: `1 passed`. Perlu waktu ~1-2 menit karena melakukan build lebih dulu.

- [ ] **Step 7: Commit**

```powershell
git add playwright.config.ts tests/e2e/smoke.spec.ts .gitignore package.json package-lock.json
git commit -m "test: pasang harness Playwright untuk E2E & API"
```

---

## Task 6: Endpoint `/api/health`

Endpoint ini adalah tumpuan pemantauan uptime di spec §4. Di Fase 0 ia hanya melaporkan bahwa aplikasi hidup; pemeriksaan database ditambahkan di Fase 1 setelah ada tabel yang bisa dihubungi.

**Files:**
- Create: `tests/api/health.spec.ts`
- Create: `src/app/api/health/route.ts`

- [ ] **Step 1: Tulis test yang gagal**

Buat `tests/api/health.spec.ts`:

```ts
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
```

Test kedua menjaga hal yang mudah terlewat: health-check yang di-cache akan melaporkan "ok" bahkan setelah aplikasi mati, sehingga pemantauan jadi tidak berguna.

- [ ] **Step 2: Jalankan untuk memastikan gagal**

```powershell
npx playwright test tests/api/health.spec.ts
```

Harapan: GAGAL — status `404`, bukan `200`.

- [ ] **Step 3: Implementasikan endpoint**

Buat `src/app/api/health/route.ts`:

```ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
```

- [ ] **Step 4: Jalankan test untuk memastikan lulus**

```powershell
npx playwright test tests/api/health.spec.ts
```

Harapan: `2 passed`.

- [ ] **Step 5: Commit**

```powershell
git add tests/api/health.spec.ts src/app/api/health/route.ts
git commit -m "feat: endpoint /api/health tanpa cache"
```

---

## Task 7: Proyek Supabase, validasi env, dan klien server

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `tests/unit/env.test.ts`
- Create: `.env.example`
- Create: `.env.local` (tidak di-commit)

- [ ] **Step 1: Buat dua proyek Supabase (manual, lewat dashboard)**

Buka https://supabase.com/dashboard dan buat dua proyek pada organisasi yang sama:

| Nama proyek | Region | Peran |
|---|---|---|
| `portofolio-dev` | Southeast Asia (Singapore) | dev lokal + Vercel preview + E2E CI |
| `portofolio-prod` | Southeast Asia (Singapore) | produksi |

Simpan **database password** masing-masing di password manager saat dibuat — nilai itu tidak bisa dilihat lagi setelahnya dan dibutuhkan Fase 1 untuk migrasi.

Untuk tiap proyek, dari **Project Settings → API**, catat: `Project URL` dan kunci `anon public`.

- [ ] **Step 2: Tulis test yang gagal untuk validasi env**

Buat `tests/unit/env.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseEnv } from '@/lib/env'

const VALID = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://contoh.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'kunci-anon-contoh',
}

describe('parseEnv', () => {
  it('menerima environment yang lengkap dan benar', () => {
    expect(parseEnv(VALID)).toEqual(VALID)
  })

  it('menolak ketika URL Supabase tidak ada', () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: undefined })).toThrow()
  })

  it('menolak ketika URL Supabase bukan URL yang sah', () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: 'bukan-url' })).toThrow()
  })

  it('menolak ketika kunci anon kosong', () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_ANON_KEY: '' })).toThrow()
  })
})
```

- [ ] **Step 3: Jalankan untuk memastikan gagal**

```powershell
npm run test:unit
```

Harapan: GAGAL — modul `@/lib/env` tidak ditemukan.

- [ ] **Step 4: Pasang dependensi dan implementasikan `env.ts`**

```powershell
npm i @supabase/supabase-js@^2.112 @supabase/ssr@^0.12 zod@^4
```

Buat `src/lib/env.ts`:

```ts
import { z } from 'zod'

const skema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

export type Env = z.infer<typeof skema>

/** Divalidasi eksplisit agar bisa diuji tanpa menyentuh process.env global. */
export function parseEnv(sumber: Record<string, string | undefined>): Env {
  const hasil = skema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: sumber.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: sumber.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  if (!hasil.success) {
    const rincian = hasil.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Environment variable tidak valid — ${rincian}`)
  }

  return hasil.data
}

// Setiap variabel dibaca sebagai akses literal `process.env.NAMA`, bukan dengan
// mengoper `process.env` utuh. Next.js hanya menyulih nilai NEXT_PUBLIC_* ke dalam
// bundel ketika melihat bentuk literal itu; mengoper objeknya membuat nilainya
// undefined begitu modul ini tersentuh dari sisi klien.
export const env = parseEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
})
```

Pesan error sengaja menyebut nama variabel yang bermasalah. Variabel env yang salah adalah penyebab kegagalan deploy paling sering, dan pesan `undefined is not a string` di tengah build tidak memberi tahu apa pun.

- [ ] **Step 5: Jalankan test untuk memastikan lulus**

```powershell
npm run test:unit
```

Harapan: `7 passed` — sanity 1 + token desain 2 + env 4.

- [ ] **Step 6: Buat `.env.example` dan `.env.local`**

Buat `.env.example` (di-commit, tanpa nilai asli):

```dotenv
# Supabase — ambil dari Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Buat `.env.local` (TIDAK di-commit) berisi nilai asli dari proyek **`portofolio-dev`**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<URL portofolio-dev>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<kunci anon portofolio-dev>
```

- [ ] **Step 7: Buat klien Supabase sisi server**

Buat `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

/** Klien untuk React Server Component & Route Handler. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Dipanggil dari Server Component, yang tidak boleh menulis cookie.
          // Aman diabaikan: middleware yang menyegarkan session (ditambahkan Fase 2).
        }
      },
    },
  })
}
```

- [ ] **Step 8: Verifikasi build & seluruh test**

```powershell
npm run build
npm run test:unit
npm run test:e2e
```

Harapan: semuanya hijau. Kalau build gagal dengan pesan "Environment variable tidak valid", berarti `.env.local` belum terbaca — periksa namanya persis `.env.local` di akar repo.

- [ ] **Step 9: Commit**

```powershell
git add src/lib .env.example tests/unit/env.test.ts package.json package-lock.json
git commit -m "feat: validasi environment berbasis Zod + klien Supabase sisi server"
```

Pastikan `.env.local` **tidak** ikut. Periksa dengan `git show --stat HEAD` — kalau muncul, batalkan commit dan perbaiki `.gitignore` sebelum push.

---

## Task 8: Workflow CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Simpan kredensial dev sebagai GitHub Secret**

CI menembak proyek `portofolio-dev`, jadi kredensialnya harus tersedia di runner.

```powershell
cd D:\portofolio-qa
gh secret set NEXT_PUBLIC_SUPABASE_URL --body "<URL portofolio-dev>"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "<kunci anon portofolio-dev>"
gh secret list
```

Harapan: kedua nama muncul di daftar.

- [ ] **Step 2: Buat workflow**

Buat `.github/workflows/ci.yml`. Ganti `master` pada `branches` bila Task 2 Step 3 menunjukkan `main`:

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Pasang dependensi
        run: npm ci

      - name: Periksa tipe
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test unit
        run: npm run test:unit

      - name: Pasang browser Playwright
        run: npx playwright install --with-deps chromium

      - name: Test E2E & API
        run: npm run test:e2e

      - name: Unggah report Playwright
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

`if: ${{ !cancelled() }}` pada langkah unggah itu penting: report paling dibutuhkan justru saat test **gagal**, dan default `if: success()` akan membuangnya persis di saat itu.

- [ ] **Step 3: Push dan tunggu hasilnya**

```powershell
git add .github/workflows/ci.yml
git commit -m "ci: workflow verifikasi (typecheck, lint, unit, e2e)"
git push
gh run watch
```

Harapan: seluruh langkah hijau. Kalau `npm ci` gagal, pastikan `package-lock.json` sudah ter-commit.

---

## Task 9: Deploy produksi Vercel + badge

**Files:**
- Create: `README.md`

- [ ] **Step 1: Tautkan proyek ke Vercel**

```powershell
cd D:\portofolio-qa
vercel login
vercel link --yes
```

Harapan: `.vercel/` terbuat. Pastikan sudah diabaikan git — scaffold Next.js menyertakan `.vercel` di `.gitignore`; kalau tidak ada, tambahkan.

- [ ] **Step 2: Tetapkan environment variable produksi**

Produksi memakai kredensial **`portofolio-prod`**, bukan dev:

```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

Lalu untuk preview deploy, yang memakai **`portofolio-dev`**:

```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

Pemisahan ini yang menjaga preview deploy tidak pernah menulis ke database produksi.

- [ ] **Step 3: Deploy ke produksi**

```powershell
vercel --prod
```

Harapan: URL produksi tercetak. Catat URL itu.

- [ ] **Step 4: Verifikasi produksi benar-benar hidup**

```powershell
curl.exe -i "https://<url-produksi>/api/health"
```

Harapan: `HTTP/2 200`, header `cache-control: no-store`, body `{"status":"ok","timestamp":"..."}`.

Jalankan juga suite E2E terhadap produksi — ini membuktikan saklar `PLAYWRIGHT_BASE_URL` bekerja, yang akan dipakai `nightly.yml` di Fase 4:

```powershell
$env:PLAYWRIGHT_BASE_URL = "https://<url-produksi>"
npm run test:e2e
Remove-Item Env:\PLAYWRIGHT_BASE_URL
```

Harapan: `3 passed`, tanpa langkah build (server tidak dijalankan lokal).

- [ ] **Step 5: Tulis README dengan badge CI**

Buat `README.md`:

```markdown
# Portofolio QA Engineer

[![CI](https://github.com/khabibrizal/portofolio-qa/actions/workflows/ci.yml/badge.svg)](https://github.com/khabibrizal/portofolio-qa/actions/workflows/ci.yml)

Landing page portofolio QA Engineer dengan admin CMS. Seluruh konten halaman berasal dari database dan diubah lewat halaman admin.

- **Desain & keputusan:** [`docs/superpowers/specs/2026-08-17-portofolio-qa-design.md`](docs/superpowers/specs/2026-08-17-portofolio-qa-design.md)
- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase, Vercel
- **Test:** Vitest (unit) + Playwright (API & E2E), dijalankan di GitHub Actions

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # isi dengan kredensial proyek Supabase dev
npm run dev
```

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run typecheck` | Periksa tipe TypeScript |
| `npm run lint` | ESLint |
| `npm run test:unit` | Test unit (Vitest) |
| `npm run test:e2e` | Test API & E2E (Playwright) |
| `npm test` | Semua di atas, berurutan |
```

- [ ] **Step 6: Commit dan push**

```powershell
git add README.md
git commit -m "docs: README dengan badge CI dan panduan menjalankan"
git push
gh run watch
```

- [ ] **Step 7: Verifikasi badge tayang**

Buka `https://github.com/khabibrizal/portofolio-qa` di browser. Harapan: badge CI di README berwarna hijau bertuliskan `passing`, dan mengklik-nya membuka daftar run.

---

## Verifikasi akhir Fase 0

Jalankan seluruh definition of done secara berurutan:

- [ ] `npm test` hijau di mesin lokal (typecheck → lint → unit → e2e)
- [ ] `gh run list --limit 1` menunjukkan run terakhir `completed / success`
- [ ] `curl.exe -i "https://<url-produksi>/api/health"` mengembalikan `200` + `{"status":"ok"}`
- [ ] Badge di README hijau
- [ ] `git status` bersih, dan `git log --stat` tidak pernah menyentuh `.env.local`
- [ ] Dua proyek Supabase ada dan password database-nya tersimpan di password manager

---

## Catatan untuk perencanaan Fase 1

Tiga hal berikut baru bisa dipastikan setelah Fase 0 selesai, dan jawabannya menentukan rencana Fase 1. Catat hasilnya:

1. **Apakah `supabase db push` berjalan tanpa Docker?** Uji dengan `npx supabase@latest link --project-ref <ref-dev>` lalu `npx supabase@latest db push` pada migrasi kosong. Kalau menuntut Docker, Fase 1 memakai fallback SQL Editor (spec §9).
2. **Bentuk connection string pooled** dari `portofolio-dev` (Project Settings → Database → Connection pooling, mode Transaction) — dibutuhkan script seed berbasis `pg`.
3. **Apakah scaffold benar-benar memberi Tailwind v4** (`@import "tailwindcss"` di `globals.css`, tanpa `tailwind.config.ts`). Kalau ternyata v3, token pindah ke `tailwind.config.ts` dan Task 4 perlu disesuaikan di Fase 1.
