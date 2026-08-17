# Fase 1b — Landing Page Merender dari Database

> **Untuk pekerja agentik:** eksekusi task demi task, berurutan. Langkah memakai checkbox (`- [ ]`).

**Goal:** Landing page dwibahasa yang seluruh isinya datang dari database — 12 section, dua URL terindeks (`/id` dan `/en`), dan degradasi yang menjamin halaman tidak pernah tampil rusak di depan orang yang sedang menilai pemiliknya.

**Architecture:** Seluruh section adalah React Server Component yang membaca lewat satu fungsi pengambil data terpusat. Halaman di-prerender statis dengan ISR, sehingga pengunjung mendapat HTML yang sudah jadi dan kegagalan database tidak pernah terlihat — Next.js tetap menyajikan render terakhir yang berhasil. JavaScript sisi klien dibatasi pada tiga hal yang benar-benar interaktif: pemindah bahasa, animasi bar skill, dan replay Automation Lab.

**Tech Stack:** Next.js 16 App Router (RSC + ISR), TypeScript, Tailwind v4, `@supabase/ssr`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-17-portofolio-qa-design.md` §5, §8
**Fase sebelumnya:** `2026-08-17-fase-1a-skema-rls-seed.md` (selesai — 12 tabel, RLS terbukti, seed dwibahasa)

---

## Prasyarat

- [ ] **Boleh mulai membangun sekarang.** Task 1-9 dikerjakan dan diuji lokal + CI tanpa perlu apa pun darimu.
- [ ] **U-1 wajib lunas sebelum Task 10 (deploy produksi).** Mulai fase ini halaman menyajikan isi database; selama `production` di Vercel masih menunjuk proyek dev, situs publik menyajikan database dev. Lihat `UTANG-TERBUKA.md`.
- [ ] **U-3 sangat disarankan lunas sebelum Task 10.** Tanpa auto-deploy, produksi bisa tertinggal dari `master` sementara badge CI tetap hijau — mulai fase ini selisih itu berarti halaman yang tayang bukan halaman yang diuji.

## Ruang lingkup

**Termasuk:** i18n berbasis path, lapisan query konten, resolver teks dwibahasa, 12 section, nav + footer + pemindah bahasa, degradasi berlapis, metadata SEO + `hreflang`, test unit & E2E.

**Tidak termasuk (Fase 2):** halaman admin, auth, form engine, CRUD, preview draft.
**Tidak termasuk (Fase 3):** pencatatan analytics.
**Tidak termasuk (Fase 4):** a11y menyeluruh, visual regression, Lighthouse, link checker.

## Definition of done

1. `/id` dan `/en` merender 12 section dari database, keduanya `200`
2. `/` mengalihkan sesuai `Accept-Language`, default Indonesia
3. Tiap halaman memuat tag `hreflang` yang saling menunjuk
4. **Tidak satu pun baris `draft` di seed muncul di halaman** — dibuktikan E2E
5. Satu section yang gagal dimuat tidak menjatuhkan sisanya — dibuktikan E2E
6. `npm test` hijau (typecheck, lint, unit, e2e), CI hijau

---

## Struktur file

```
src/
  lib/
    i18n/
      locales.ts              # daftar locale, default, type guard
      resolve.ts              # teks() — ambil satu bahasa + fallback
    content/
      types.ts                # LocalizedText, MediaRef, tipe baris per tabel
      queries.ts              # satu fungsi per koleksi
      get-page-content.ts     # ambil semua paralel, tahan gagal sebagian
  app/
    page.tsx                  # pengalih / → /id | /en
    [locale]/
      layout.tsx              # <html lang>, hreflang, metadata
      page.tsx                # komposisi 12 section
  components/
    ui/
      Wrap.tsx                # container lebar tetap
      Eyebrow.tsx             # label "// SECTION"
      SectionHeading.tsx
    layout/
      Nav.tsx
      Footer.tsx
      LanguageSwitcher.tsx    # client
    sections/
      Hero.tsx  TrustStrip.tsx  About.tsx  Coverage.tsx
      CaseStudies.tsx  AutomationLab.tsx  Timeline.tsx
      Certifications.tsx  Testimonials.tsx  FinalCta.tsx
      SkillBars.tsx           # client — animasi saat masuk viewport
      LabRunner.tsx           # client — replay langkah
tests/
  unit/i18n.test.ts
  unit/content-types.test.ts
  e2e/landing-id.spec.ts
  e2e/landing-en.spec.ts
  e2e/draft-tidak-tampil.spec.ts
  e2e/degradasi.spec.ts
```

**Batas tanggung jawab.** `get-page-content.ts` satu-satunya yang tahu bagaimana data diambil; section tidak pernah memanggil Supabase sendiri. `resolve.ts` satu-satunya yang tahu bagaimana memilih bahasa; komponen tidak pernah menulis `.id` atau `.en` langsung. Dua batas ini yang membuat perubahan sumber data atau penambahan bahasa tidak menyentuh 12 berkas section.

---

## Task 1: Fondasi i18n

**Files:** `src/lib/i18n/locales.ts`, `src/lib/i18n/resolve.ts`, `tests/unit/i18n.test.ts`

- [ ] **Step 1: Tulis test yang gagal**

`tests/unit/i18n.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES, isLocale, pilihLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

describe('locales', () => {
  it('mendukung tepat dua bahasa dengan default Indonesia', () => {
    expect(LOCALES).toEqual(['id', 'en'])
    expect(DEFAULT_LOCALE).toBe('id')
  })

  it('mengenali locale yang sah', () => {
    expect(isLocale('id')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('jv')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

describe('pilihLocale dari Accept-Language', () => {
  it('memilih Inggris ketika diminta lebih dulu', () => {
    expect(pilihLocale('en-US,en;q=0.9,id;q=0.8')).toBe('en')
  })

  it('memilih Indonesia ketika diminta lebih dulu', () => {
    expect(pilihLocale('id-ID,id;q=0.9,en;q=0.8')).toBe('id')
  })

  it('menghormati bobot q, bukan urutan kemunculan', () => {
    expect(pilihLocale('en;q=0.3,id;q=0.9')).toBe('id')
  })

  it('jatuh ke default saat header tidak dikenal atau kosong', () => {
    expect(pilihLocale('fr-FR,de;q=0.8')).toBe('id')
    expect(pilihLocale('')).toBe('id')
    expect(pilihLocale(null)).toBe('id')
  })
})

describe('teks', () => {
  const halo = { id: 'Halo', en: 'Hello' }

  it('mengambil bahasa yang diminta', () => {
    expect(teks(halo, 'id')).toBe('Halo')
    expect(teks(halo, 'en')).toBe('Hello')
  })

  it('jatuh ke bahasa lain ketika yang diminta kosong', () => {
    expect(teks({ id: '', en: 'Hello' }, 'id')).toBe('Hello')
    expect(teks({ id: 'Halo', en: '   ' }, 'en')).toBe('Halo')
  })

  it('mengembalikan string kosong, bukan melempar, saat nilainya tidak ada', () => {
    expect(teks(null, 'id')).toBe('')
    expect(teks(undefined, 'en')).toBe('')
    expect(teks({ id: '', en: '' }, 'id')).toBe('')
  })
})
```

Assertion terakhir disengaja: satu field kosong di database tidak boleh menjatuhkan seluruh halaman. Melempar di sini berarti satu kolom yang lupa diisi membuat situs mati — kegagalan yang jauh lebih mahal daripada teks yang hilang.

- [ ] **Step 2:** `npm run test:unit` → GAGAL, modul belum ada.

- [ ] **Step 3: Implementasi `src/lib/i18n/locales.ts`**

```ts
export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(nilai: unknown): nilai is Locale {
  return typeof nilai === 'string' && (LOCALES as readonly string[]).includes(nilai)
}

/**
 * Memilih locale dari header Accept-Language.
 * Bobot `q` dihormati, bukan sekadar urutan kemunculan — peramban kerap
 * mengirim daftar panjang yang urutannya tidak mencerminkan preferensi.
 */
export function pilihLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const kandidat = acceptLanguage
    .split(',')
    .map((bagian) => {
      const [tag, ...params] = bagian.trim().split(';')
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2)
      return { bahasa: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q) : 1 }
    })
    .filter((k) => isLocale(k.bahasa) && !Number.isNaN(k.q))
    .sort((a, b) => b.q - a.q)

  const teratas = kandidat[0]
  return teratas && isLocale(teratas.bahasa) ? teratas.bahasa : DEFAULT_LOCALE
}
```

- [ ] **Step 4: Implementasi `src/lib/i18n/resolve.ts`**

```ts
import type { Locale } from './locales'

export type LocalizedText = { id: string; en: string }

/**
 * Mengambil satu bahasa dari teks dwibahasa.
 *
 * Tidak pernah melempar. Field yang kosong atau hilang menghasilkan string
 * kosong sehingga section yang bersangkutan bisa memilih menyembunyikan
 * dirinya — satu kolom yang lupa diisi tidak boleh menjatuhkan halaman.
 */
export function teks(nilai: LocalizedText | null | undefined, locale: Locale): string {
  if (!nilai) return ''

  const diminta = nilai[locale]?.trim()
  if (diminta) return diminta

  const cadangan = locale === 'id' ? nilai.en : nilai.id
  return cadangan?.trim() ?? ''
}
```

- [ ] **Step 5:** `npm run test:unit` → LULUS (9 lama + 9 baru = 18).
- [ ] **Step 6: Commit** — `feat(i18n): locale, pemilih Accept-Language, resolver teks dwibahasa`

---

## Task 2: Tipe konten dan lapisan query

**Files:** `src/lib/content/types.ts`, `src/lib/content/queries.ts`, `src/lib/content/get-page-content.ts`, `tests/unit/content-types.test.ts`

- [ ] **Step 1: Tulis `src/lib/content/types.ts`**

```ts
import type { LocalizedText } from '@/lib/i18n/resolve'

export type { LocalizedText }

export type MediaRef = {
  path: string
  alt: LocalizedText
  width: number
  height: number
}

export type StatusPublikasi = 'draft' | 'published'

export type SiteSettings = {
  site_title: LocalizedText
  meta_description: LocalizedText
  og_image: MediaRef | null
  favicon: MediaRef | null
  availability_status: 'available' | 'open' | 'unavailable'
  contact_email: string
  whatsapp_number: string | null
  linkedin_url: string | null
  github_url: string | null
  resume_pdf: string | null
  final_cta_headline: LocalizedText
  final_cta_subtext: LocalizedText
  copyright_text: LocalizedText
  updated_at: string
}

export type Tautan = { label: LocalizedText; link: string }
export type Statistik = { label: LocalizedText; value: string }
export type PemeriksaanStatus = { label: LocalizedText; status: string; duration_label: string }

export type Hero = {
  full_name: string
  role_title: LocalizedText
  short_intro: LocalizedText
  key_stats: Statistik[]
  status_checks: PemeriksaanStatus[]
  cta_primary: Tautan
  cta_secondary: Tautan | null
}

export type About = {
  profile_photo: MediaRef | null
  about_richtext: LocalizedText
  highlight_badges: { text: LocalizedText }[]
}

export type Tool = { id: string; name: string; logo: MediaRef | null }

export type Skill = { name: string; proficiency_percent: number; years: number }
export type SkillCategory = { id: string; category_name: LocalizedText; skills: Skill[] }

export type Metrik = { label: LocalizedText; value: string }
export type Langkah = { text: LocalizedText }
export type Bukti = { label: LocalizedText; url: string }

export type CaseStudy = {
  id: string
  test_code: string
  project_name: LocalizedText
  role: LocalizedText
  objective: LocalizedText
  tools_used: string[]
  process_steps: Langkah[]
  result_metrics: Metrik[]
  evidence_links: Bukti[]
  status_badge: 'completed' | 'ongoing'
}

export type LangkahLab = { label: LocalizedText; duration_ms: number; status: string }
export type RingkasanLab = { total: number; passed: number; failed: number; duration: string }

export type LabScenario = {
  id: string
  framework_name: string
  scenario_title: LocalizedText
  scenario_description: LocalizedText
  tags: string[]
  steps: LangkahLab[]
  result_summary: RingkasanLab | null
  full_report_url: string | null
}

export type Experience = {
  id: string
  company: LocalizedText
  role: LocalizedText
  period_start: string
  period_end: string | null
  location: string | null
  responsibilities: Langkah[]
  achievements: Langkah[]
}

export type Certification = {
  id: string
  name: string
  issuer: string
  year: number
  credential_url: string | null
}

export type Education = { id: string; institution: string; degree: LocalizedText; year: number }

export type Testimonial = {
  id: string
  quote: LocalizedText
  author_name: string
  author_role: LocalizedText
  author_company: string | null
  photo: MediaRef | null
}

export type PageContent = {
  siteSettings: SiteSettings | null
  hero: Hero | null
  about: About | null
  tools: Tool[]
  skillCategories: SkillCategory[]
  caseStudies: CaseStudy[]
  labScenarios: LabScenario[]
  experiences: Experience[]
  certifications: Certification[]
  education: Education[]
  testimonials: Testimonial[]
}
```

- [ ] **Step 2: Tulis `src/lib/content/queries.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import type {
  About, CaseStudy, Certification, Education, Experience, Hero,
  LabScenario, SiteSettings, SkillCategory, Testimonial, Tool,
} from './types'

/**
 * Semua query koleksi memakai pola yang sama: hanya baris published, urut
 * sort_order. Pola ini sengaja cocok dengan indeks (status, sort_order) yang
 * dibuat di Fase 1a.
 *
 * Filter `status` di sini adalah kenyamanan, BUKAN pengaman: RLS di database
 * yang menjamin klien anonim tak pernah menerima draft, dan itu yang diuji.
 */
async function koleksi<T>(tabel: string, kolom: string): Promise<T[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(tabel)
    .select(kolom)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal memuat ${tabel}: ${error.message}`)
  return (data ?? []) as T[]
}

async function singleton<T>(tabel: string, kolom: string): Promise<T | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from(tabel).select(kolom).eq('id', 1).maybeSingle()

  if (error) throw new Error(`Gagal memuat ${tabel}: ${error.message}`)
  return (data ?? null) as T | null
}

export const ambilSiteSettings = () =>
  singleton<SiteSettings>(
    'site_settings',
    'site_title, meta_description, og_image, favicon, availability_status, contact_email, whatsapp_number, linkedin_url, github_url, resume_pdf, final_cta_headline, final_cta_subtext, copyright_text, updated_at',
  )

export const ambilHero = () =>
  singleton<Hero>(
    'hero',
    'full_name, role_title, short_intro, key_stats, status_checks, cta_primary, cta_secondary',
  )

export const ambilAbout = () =>
  singleton<About>('about', 'profile_photo, about_richtext, highlight_badges')

export const ambilTools = () => koleksi<Tool>('tools', 'id, name, logo')

export const ambilSkillCategories = () =>
  koleksi<SkillCategory>('skill_categories', 'id, category_name, skills')

export const ambilCaseStudies = () =>
  koleksi<CaseStudy>(
    'case_studies',
    'id, test_code, project_name, role, objective, tools_used, process_steps, result_metrics, evidence_links, status_badge',
  )

export const ambilLabScenarios = () =>
  koleksi<LabScenario>(
    'lab_scenarios',
    'id, framework_name, scenario_title, scenario_description, tags, steps, result_summary, full_report_url',
  )

export const ambilExperiences = () =>
  koleksi<Experience>(
    'experiences',
    'id, company, role, period_start, period_end, location, responsibilities, achievements',
  )

export const ambilCertifications = () =>
  koleksi<Certification>('certifications', 'id, name, issuer, year, credential_url')

export const ambilEducation = () => koleksi<Education>('education', 'id, institution, degree, year')

export const ambilTestimonials = () =>
  koleksi<Testimonial>(
    'testimonials',
    'id, quote, author_name, author_role, author_company, photo',
  )
```

- [ ] **Step 3: Tulis `src/lib/content/get-page-content.ts`**

```ts
import {
  ambilAbout, ambilCaseStudies, ambilCertifications, ambilEducation, ambilExperiences,
  ambilHero, ambilLabScenarios, ambilSiteSettings, ambilSkillCategories, ambilTestimonials,
  ambilTools,
} from './queries'
import type { PageContent } from './types'

/**
 * Mengambil seluruh konten halaman sekaligus.
 *
 * Memakai allSettled, bukan all: satu koleksi yang gagal tidak boleh
 * menjatuhkan sebelas lainnya. Section yang datanya kosong akan menyembunyikan
 * dirinya sendiri, sehingga halaman tetap utuh dan tetap berguna.
 * Kegagalan dicatat ke log server agar tetap terlihat oleh pemilik.
 */
async function aman<T>(nama: string, janji: Promise<T>, kosong: T): Promise<T> {
  try {
    return await janji
  } catch (e) {
    console.error(`[konten] ${nama} gagal dimuat:`, e instanceof Error ? e.message : e)
    return kosong
  }
}

export async function getPageContent(): Promise<PageContent> {
  const [
    siteSettings, hero, about, tools, skillCategories, caseStudies,
    labScenarios, experiences, certifications, education, testimonials,
  ] = await Promise.all([
    aman('site_settings', ambilSiteSettings(), null),
    aman('hero', ambilHero(), null),
    aman('about', ambilAbout(), null),
    aman('tools', ambilTools(), []),
    aman('skill_categories', ambilSkillCategories(), []),
    aman('case_studies', ambilCaseStudies(), []),
    aman('lab_scenarios', ambilLabScenarios(), []),
    aman('experiences', ambilExperiences(), []),
    aman('certifications', ambilCertifications(), []),
    aman('education', ambilEducation(), []),
    aman('testimonials', ambilTestimonials(), []),
  ])

  return {
    siteSettings, hero, about, tools, skillCategories, caseStudies,
    labScenarios, experiences, certifications, education, testimonials,
  }
}
```

- [ ] **Step 4: Tulis test tipe** `tests/unit/content-types.test.ts`

Test ini menjaga bentuk `PageContent` tetap lengkap — kalau ada kunci yang hilang saat refactor, section yang bersangkutan diam-diam hilang dari halaman tanpa error.

```ts
import { describe, expect, it } from 'vitest'
import type { PageContent } from '@/lib/content/types'

const KUNCI_WAJIB = [
  'siteSettings', 'hero', 'about', 'tools', 'skillCategories', 'caseStudies',
  'labScenarios', 'experiences', 'certifications', 'education', 'testimonials',
] as const

describe('bentuk PageContent', () => {
  it('memuat kunci untuk setiap section', () => {
    const kosong: PageContent = {
      siteSettings: null, hero: null, about: null, tools: [], skillCategories: [],
      caseStudies: [], labScenarios: [], experiences: [], certifications: [],
      education: [], testimonials: [],
    }
    expect(Object.keys(kosong).sort()).toEqual([...KUNCI_WAJIB].sort())
  })
})
```

- [ ] **Step 5:** `npm run test:unit` dan `npm run typecheck` → hijau.
- [ ] **Step 6: Commit** — `feat(content): tipe konten + lapisan query tahan gagal sebagian`

---

## Task 3: Routing `[locale]`, pengalihan, dan hreflang

**Files:** `src/app/page.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, hapus `src/app/layout.tsx` lama? **Tidak** — root layout tetap ada, lihat catatan.

- [ ] **Step 1: Tulis test E2E yang gagal** — `tests/e2e/rute-locale.spec.ts`

```ts
import { expect, test } from '@playwright/test'

test('/id merender dan menetapkan lang=id', async ({ page }) => {
  const res = await page.goto('/id')
  expect(res?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})

test('/en merender dan menetapkan lang=en', async ({ page }) => {
  const res = await page.goto('/en')
  expect(res?.status()).toBe(200)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('/ mengalihkan ke salah satu locale', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/(id|en)$/)
})

test('kedua halaman memuat hreflang yang saling menunjuk', async ({ page }) => {
  for (const locale of ['id', 'en']) {
    await page.goto(`/${locale}`)
    const id = page.locator('link[rel="alternate"][hreflang="id"]')
    const en = page.locator('link[rel="alternate"][hreflang="en"]')
    await expect(id).toHaveCount(1)
    await expect(en).toHaveCount(1)
    await expect(id).toHaveAttribute('href', /\/id$/)
    await expect(en).toHaveAttribute('href', /\/en$/)
  }
})

test('locale yang tidak dikenal menghasilkan 404', async ({ page }) => {
  const res = await page.goto('/jv')
  expect(res?.status()).toBe(404)
})
```

- [ ] **Step 2:** jalankan → GAGAL (404 pada `/id`).

- [ ] **Step 3: Ubah `src/app/layout.tsx` jadi pembungkus tanpa `<html>`**

Next.js mensyaratkan root layout memuat `<html>` dan `<body>`. Karena `lang` harus mengikuti locale, elemen itu pindah ke `[locale]/layout.tsx`, dan root layout menjadi penerus sederhana. Ganti seluruh isi `src/app/layout.tsx`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

Konsekuensi yang perlu diketahui: Next akan memperingatkan bila ada rute di luar `[locale]` yang dirender tanpa `<html>`. Rute yang tersisa di luar `[locale]` hanyalah `/` (pengalih, tidak pernah merender) dan `/api/health` (bukan halaman), jadi aman.

- [ ] **Step 4: Buat `src/app/page.tsx` sebagai pengalih**

```tsx
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { pilihLocale } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic'

export default async function Root() {
  const daftarHeader = await headers()
  redirect(`/${pilihLocale(daftarHeader.get('accept-language'))}`)
}
```

- [ ] **Step 5: Buat `src/app/[locale]/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'
import { notFound } from 'next/navigation'
import { ambilSiteSettings } from '@/lib/content/queries'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'
import '../globals.css'

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk', subsets: ['latin'],
  weight: ['500', '600', '700'], display: 'swap',
})
const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans', subsets: ['latin'],
  weight: ['400', '500', '600', '700'], display: 'swap',
})
const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono', subsets: ['latin'],
  weight: ['400', '500', '600'], display: 'swap',
})

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  // Metadata tidak boleh menjatuhkan halaman kalau database bermasalah.
  const settings = await ambilSiteSettings().catch(() => null)

  return {
    title: teks(settings?.site_title, locale) || 'Portofolio QA Engineer',
    description: teks(settings?.meta_description, locale) || undefined,
    alternates: {
      canonical: `/${locale}`,
      languages: { id: '/id', en: '/en' },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
```

`alternates.languages` inilah yang menghasilkan tag `hreflang` — tidak perlu menulis `<link>` manual.

- [ ] **Step 6: Buat `src/app/[locale]/page.tsx` sementara**

Isi sementara, diganti Task 4-8 saat section bertambah:

```tsx
import { notFound } from 'next/navigation'
import { getPageContent } from '@/lib/content/get-page-content'
import { isLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

export const revalidate = 300

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const konten = await getPageContent()

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-24">
      <h1 className="font-display text-3xl font-bold">
        {teks(konten.hero?.role_title, locale)}
      </h1>
      <p className="mt-2 text-ink-soft">{teks(konten.hero?.short_intro, locale)}</p>
    </main>
  )
}
```

`revalidate = 300` inilah tulang punggung degradasi: halaman disajikan sebagai HTML statis yang sudah jadi, dan bila revalidasi gagal karena database bermasalah, Next tetap menyajikan render terakhir yang berhasil.

- [ ] **Step 7: Hapus placeholder lama** — hapus isi lama `src/app/page.tsx` (sudah diganti di Step 4).

- [ ] **Step 8:** `npm run build` lalu `npm run test:e2e` → seluruh test rute hijau.
- [ ] **Step 9: Commit** — `feat(app): routing dwibahasa berbasis path + hreflang + ISR`

---

## Task 4: Primitif UI, Nav, Footer, pemindah bahasa

**Files:** `src/components/ui/*.tsx`, `src/components/layout/*.tsx`

- [ ] **Step 1: Primitif** — `src/components/ui/Wrap.tsx`

```tsx
export function Wrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1140px] px-6 ${className}`}>{children}</div>
}
```

`src/components/ui/Eyebrow.tsx`:

```tsx
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-primary">
      <span className="text-ink-faint">//</span>
      {children}
    </div>
  )
}
```

`src/components/ui/SectionHeading.tsx`:

```tsx
export function SectionHeading({
  judul,
  intro,
}: {
  judul: string
  intro?: string
}) {
  return (
    <>
      <h2 className="mb-3 font-display text-[clamp(26px,3.4vw,36px)] font-bold tracking-[-0.01em]">
        {judul}
      </h2>
      {intro ? <p className="mb-11 max-w-[560px] text-[15.5px] text-ink-soft">{intro}</p> : null}
    </>
  )
}
```

- [ ] **Step 2: Pemindah bahasa** — `src/components/layout/LanguageSwitcher.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, type Locale } from '@/lib/i18n/locales'

export function LanguageSwitcher({ aktif }: { aktif: Locale }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={pathname.replace(/^\/(id|en)/, `/${locale}`)}
          hrefLang={locale}
          aria-current={locale === aktif ? 'true' : undefined}
          className={
            locale === aktif
              ? 'rounded px-2 py-1 text-primary underline underline-offset-4'
              : 'rounded px-2 py-1 text-ink-faint hover:text-primary'
          }
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
```

Memakai `<Link>` sungguhan, bukan tombol dengan `router.push`: tautan tetap bisa dibuka di tab baru, terbaca perayap, dan berfungsi tanpa JavaScript.

- [ ] **Step 3: Nav** — `src/components/layout/Nav.tsx`

```tsx
import { Wrap } from '@/components/ui/Wrap'
import type { SiteSettings } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { LanguageSwitcher } from './LanguageSwitcher'

const LABEL_STATUS: Record<SiteSettings['availability_status'], Record<Locale, string>> = {
  available: { id: 'Tersedia', en: 'Available' },
  open: { id: 'Terbuka untuk Peluang', en: 'Open to Opportunities' },
  unavailable: { id: 'Tidak Tersedia', en: 'Not Available' },
}

const TAUTAN = [
  { anchor: 'tentang', label: { id: 'Tentang', en: 'About' } },
  { anchor: 'coverage', label: { id: 'Keahlian', en: 'Skills' } },
  { anchor: 'studi-kasus', label: { id: 'Studi Kasus', en: 'Case Studies' } },
  { anchor: 'automation-lab', label: { id: 'Automation Lab', en: 'Automation Lab' } },
  { anchor: 'pengalaman', label: { id: 'Pengalaman', en: 'Experience' } },
]

export function Nav({ settings, locale }: { settings: SiteSettings | null; locale: Locale }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      <Wrap className="flex h-[72px] items-center justify-between">
        <span className="font-mono text-[15px] font-semibold">
          QA<span className="text-pass">_</span>portfolio
        </span>

        <nav className="hidden gap-7 text-sm text-ink-soft md:flex">
          {TAUTAN.map((t) => (
            <a key={t.anchor} href={`#${t.anchor}`} className="hover:text-primary">
              {t.label[locale]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {settings ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-pass-bg px-3 py-1.5 font-mono text-xs text-pass sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-pass" aria-hidden />
              {LABEL_STATUS[settings.availability_status][locale]}
            </span>
          ) : null}
          <LanguageSwitcher aktif={locale} />
        </div>
      </Wrap>
    </header>
  )
}
```

- [ ] **Step 4: Footer** — `src/components/layout/Footer.tsx`

```tsx
import { Wrap } from '@/components/ui/Wrap'
import type { SiteSettings } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

const LABEL_DIPERBARUI: Record<Locale, string> = {
  id: 'Terakhir diperbarui',
  en: 'Last updated',
}

export function Footer({ settings, locale }: { settings: SiteSettings | null; locale: Locale }) {
  if (!settings) return null

  const diperbarui = new Date(settings.updated_at).toLocaleDateString(
    locale === 'id' ? 'id-ID' : 'en-GB',
    { year: 'numeric', month: 'long' },
  )

  return (
    <footer className="border-t border-border py-9">
      <Wrap className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ink-faint">
        <span>
          {teks(settings.copyright_text, locale)} · {LABEL_DIPERBARUI[locale]} {diperbarui}
        </span>
        <div className="flex gap-4">
          {settings.linkedin_url ? (
            <a href={settings.linkedin_url} className="hover:text-primary">LinkedIn</a>
          ) : null}
          {settings.github_url ? (
            <a href={settings.github_url} className="hover:text-primary">GitHub</a>
          ) : null}
          <a href={`mailto:${settings.contact_email}`} className="hover:text-primary">Email</a>
        </div>
      </Wrap>
    </footer>
  )
}
```

`last_updated` yang diminta spec diambil dari `updated_at` — satu sumber kebenaran, terisi otomatis oleh trigger database.

- [ ] **Step 5:** rangkai Nav dan Footer ke `[locale]/page.tsx`, jalankan `npm run build` dan `npm run test:e2e` → hijau.
- [ ] **Step 6: Commit** — `feat(ui): primitif, nav, footer, pemindah bahasa`

---

## Task 5-8: Section

Setiap section mengikuti kontrak yang sama, dan ini yang membuatnya bisa dikerjakan berurutan tanpa saling mengganggu:

1. Menerima data yang sudah diambil sebagai prop — **tidak pernah memanggil Supabase sendiri**
2. Menerima `locale` dan memakai `teks()` — **tidak pernah menulis `.id` atau `.en` langsung**
3. **Mengembalikan `null` bila datanya kosong** — inilah yang membuat satu section gagal tidak menjatuhkan sisanya
4. Punya `id` anchor yang cocok dengan tautan di Nav

- [ ] **Task 5:** `Hero` (+ konsol status), `TrustStrip`
- [ ] **Task 6:** `About`, `Coverage` (+ `SkillBars` client untuk animasi)
- [ ] **Task 7:** `CaseStudies`, `AutomationLab` (+ `LabRunner` client untuk replay)
- [ ] **Task 8:** `Timeline`, `Certifications`, `Testimonials`, `FinalCta`

Tiap task: bangun section, rangkai ke `[locale]/page.tsx`, tambah assertion ke `tests/e2e/landing-id.spec.ts` dan `landing-en.spec.ts` yang memeriksa **teks dari seed benar-benar tampil** (bukan sekadar elemen ada), lalu commit.

Rujukan tata letak dan kelas: mockup yang sudah disetujui. Seluruh warna dan font **hanya** lewat token (`text-ink-soft`, `font-display`, `bg-pass-bg`, …) — tidak boleh ada hex di komponen, dan `tests/unit/design-tokens.test.ts` sudah menjaga tokennya.

---

## Task 9: Degradasi berlapis

**Files:** `tests/e2e/degradasi.spec.ts`, `tests/e2e/draft-tidak-tampil.spec.ts`

- [ ] **Step 1: Test draft tidak tampil**

```ts
import { expect, test } from '@playwright/test'

// Nilai-nilai ini ditanam sebagai baris draft di supabase/seed.sql.
// Kalau salah satu muncul di halaman, berarti draft bocor ke publik.
const PENANDA_DRAFT = ['Tool Draft', 'TC-999', 'Kategori Draft', 'Draft Category']

for (const locale of ['id', 'en']) {
  test(`/${locale}: tidak satu pun baris draft tampil`, async ({ page }) => {
    await page.goto(`/${locale}`)
    const isi = await page.locator('body').innerText()
    for (const penanda of PENANDA_DRAFT) {
      expect(isi, `penanda draft "${penanda}" bocor ke halaman`).not.toContain(penanda)
    }
  })
}
```

- [ ] **Step 2: Test degradasi per-section**

```ts
import { expect, test } from '@playwright/test'

test('halaman tetap utuh ketika satu section kosong', async ({ page }) => {
  // Section yang datanya kosong menyembunyikan dirinya; yang lain tetap tampil.
  // Diverifikasi lewat keberadaan hero + footer, dua ujung halaman.
  await page.goto('/id')
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()
})

test('halaman tidak pernah menampilkan layar error Next.js', async ({ page }) => {
  await page.goto('/id')
  const isi = await page.locator('body').innerText()
  expect(isi).not.toContain('Application error')
  expect(isi).not.toContain('This page could not be found')
})
```

- [ ] **Step 3: Uji daya gigit degradasi**

Kosongkan satu tabel lewat skrip, muat ulang halaman, dan pastikan halaman **tetap 200** dengan section lain utuh:

```
node -e "..." # truncate public.testimonials
npm run build && npx playwright test tests/e2e
npm run db:reset
```

Kalau halaman jadi 500, `aman()` di `get-page-content.ts` atau penjaga `null` di section belum bekerja — perbaiki, jangan longgarkan test.

- [ ] **Step 4: Commit** — `test(app): draft tidak bocor + degradasi per-section`

---

## Task 10: Deploy dan verifikasi produksi

**Prasyarat: U-1 lunas.**

- [ ] **Step 1:** pastikan `production` di Vercel menunjuk `portofolio-prod`, dan jalankan migrasi + seed ke proyek itu (`SUPABASE_DB_*` diarahkan sementara ke prod, `npm run db:push && npm run db:seed`).
- [ ] **Step 2:** `vercel deploy --prod --scope happyphotostudio-s-projects --yes`
- [ ] **Step 3:** verifikasi `/id`, `/en`, `/` (redirect), dan `/api/health` di URL produksi.
- [ ] **Step 4:** `PLAYWRIGHT_BASE_URL=<url-produksi> npx playwright test tests/e2e` → hijau.
- [ ] **Step 5:** tandai U-1 lunas di `UTANG-TERBUKA.md`, commit.

---

## Verifikasi akhir Fase 1b

- [ ] `/id` dan `/en` merender 12 section dari database
- [ ] `/` mengalihkan sesuai `Accept-Language`
- [ ] `hreflang` saling menunjuk di kedua halaman
- [ ] Tidak satu pun penanda draft muncul di halaman
- [ ] Mengosongkan satu tabel tidak membuat halaman 500
- [ ] `npm test` hijau, CI hijau
- [ ] U-1 lunas dan produksi menunjuk `portofolio-prod`
