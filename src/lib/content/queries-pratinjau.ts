import { createClient } from '@/lib/supabase/server'
import {
  KOLOM_CASE_STUDIES, KOLOM_CERTIFICATIONS, KOLOM_EDUCATION, KOLOM_EXPERIENCES,
  KOLOM_LAB_SCENARIOS, KOLOM_SKILL_CATEGORIES, KOLOM_TESTIMONIALS, KOLOM_TOOLS,
} from './queries'
import type {
  CaseStudy, Certification, Education, Experience, LabScenario, SkillCategory, StatusPublikasi,
  Testimonial, Tool,
} from './types'

/** Satu baris koleksi, ditambah statusnya — dipakai pratinjau untuk menandai draft. */
export type DenganStatus<T> = T & { status: StatusPublikasi }

/**
 * Versi PRATINJAU dari `koleksi()` di `queries.ts` — sengaja berkas TERPISAH,
 * bukan parameter tambahan pada fungsi yang sama, karena tiga hal berbeda
 * sekaligus dari versi landing:
 *
 *  - Klien: cookie-based (`@/lib/supabase/server`), BUKAN anonim
 *    (`@/lib/supabase/public`). RLS (Fase 1a) hanya mengizinkan PEMILIK yang
 *    login membaca baris berstatus draft — klien anonim akan diam-diam
 *    hanya mengembalikan yang terbit, TANPA error apa pun, dan pratinjau
 *    jadi tidak ada gunanya (catatan yang sama berlaku di
 *    `lib/admin/entri.ts` untuk daftar entri admin).
 *  - Filter: TANPA `.eq('status', 'published')` — pratinjau justru harus
 *    memperlihatkan draft.
 *  - Kolom: menambah `status` ke setiap baris, supaya pemanggil (panel
 *    ringkasan draft di halaman pratinjau) tahu entri mana yang belum
 *    terbit.
 *
 * Modul ini TIDAK pernah diimpor dari jalur landing mana pun —
 * `app/[locale]/page.tsx` hanya memanggil `getPageContent()`, yang hanya
 * mengimpor `queries.ts`. Landing tidak bisa "tertukar" memakai modul ini
 * kecuali diedit secara eksplisit untuk memanggilnya — dan itu persis yang
 * dibuktikan gagal oleh uji daya gigit Task 7 (lihat `get-page-content.ts`).
 *
 * Daftar kolom diimpor dari `queries.ts` (bukan disalin ulang) supaya
 * pratinjau tidak bisa diam-diam menampilkan field berbeda dari landing.
 */
async function koleksiPratinjau<T>(tabel: string, kolom: string): Promise<DenganStatus<T>[]> {
  const supabase = await createClient()
  // Konkatenasi `+`, BUKAN template literal `` `${kolom}, status` ``: TypeScript
  // melebarkan hasil `+` menjadi `string` polos (sama seperti `kolom` itu
  // sendiri), sedangkan template literal dipertahankan sebagai TIPE literal
  // `` `${string}, status` `` — overload `.select()` Supabase mencoba
  // mem-parse bentuk literal itu sebagai query kolom dan gagal (`ParserError`)
  // karena `${string}` generik tidak bisa dipecah jadi nama kolom nyata.
  const { data, error } = await supabase
    .from(tabel)
    .select(kolom + ', status')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal memuat ${tabel} (pratinjau): ${error.message}`)
  // `unknown` dulu, baru `DenganStatus<T>[]`: hasil inferensi Supabase untuk
  // select string hasil konkatenasi tidak "cukup overlap" secara struktural
  // dengan tipe generik `T & { status }` menurut TypeScript, walau secara
  // runtime bentuknya persis baris tabel + kolom `status` sebagaimana
  // diminta. Sama seperti cast `T[]` di `koleksi()` (queries.ts) — kepercayaan
  // pada kontrak kolom yang kita minta sendiri, bukan pada tipe generated
  // Supabase yang tidak dipakai proyek ini.
  return (data ?? []) as unknown as DenganStatus<T>[]
}

// site_settings/hero/about TIDAK punya kolom `status` maupun kebijakan RLS
// yang membedakan draft (lihat migrations/20260818000005_rls.sql — ketiganya
// "baca publik" untuk anon MAUPUN authenticated, `using (true)`). Jadi
// pratinjau memakai ulang `ambilSiteSettings`/`ambilHero`/`ambilAbout` dari
// `queries.ts` apa adanya — tidak ada versi "tanpa filter" untuk ketiganya
// karena tidak ada apa pun untuk difilter.

export const ambilToolsPratinjau = () => koleksiPratinjau<Tool>('tools', KOLOM_TOOLS)

export const ambilSkillCategoriesPratinjau = () =>
  koleksiPratinjau<SkillCategory>('skill_categories', KOLOM_SKILL_CATEGORIES)

export const ambilCaseStudiesPratinjau = () =>
  koleksiPratinjau<CaseStudy>('case_studies', KOLOM_CASE_STUDIES)

export const ambilLabScenariosPratinjau = () =>
  koleksiPratinjau<LabScenario>('lab_scenarios', KOLOM_LAB_SCENARIOS)

export const ambilExperiencesPratinjau = () =>
  koleksiPratinjau<Experience>('experiences', KOLOM_EXPERIENCES)

export const ambilCertificationsPratinjau = () =>
  koleksiPratinjau<Certification>('certifications', KOLOM_CERTIFICATIONS)

export const ambilEducationPratinjau = () =>
  koleksiPratinjau<Education>('education', KOLOM_EDUCATION)

export const ambilTestimonialsPratinjau = () =>
  koleksiPratinjau<Testimonial>('testimonials', KOLOM_TESTIMONIALS)
