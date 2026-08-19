import { createPublicClient } from '@/lib/supabase/public'
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
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from(tabel)
    .select(kolom)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Gagal memuat ${tabel}: ${error.message}`)
  return (data ?? []) as T[]
}

async function singleton<T>(tabel: string, kolom: string): Promise<T | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase.from(tabel).select(kolom).eq('id', 1).maybeSingle()

  if (error) throw new Error(`Gagal memuat ${tabel}: ${error.message}`)
  return (data ?? null) as T | null
}

// Daftar kolom diekspor (bukan disembunyikan sebagai literal inline) supaya
// `queries-pratinjau.ts` (Task 7) bisa memakai PERSIS kolom yang sama saat
// mengambil versi tanpa-filter-status untuk pratinjau admin — tanpa
// menyalin daftar kolom secara terpisah yang bisa diam-diam menyimpang dari
// yang landing pakai begitu satu field ditambah/dihapus di sini.
export const KOLOM_SITE_SETTINGS =
  'site_title, meta_description, og_image, favicon, availability_status, contact_email, whatsapp_number, linkedin_url, github_url, resume_pdf, final_cta_headline, final_cta_subtext, copyright_text, location, languages, updated_at'

export const KOLOM_HERO =
  'full_name, role_title, short_intro, key_stats, status_checks, cta_primary, cta_secondary'

export const KOLOM_ABOUT = 'profile_photo, about_richtext, highlight_badges'

export const KOLOM_TOOLS = 'id, name, logo'

export const KOLOM_SKILL_CATEGORIES = 'id, category_name, skills'

export const KOLOM_CASE_STUDIES =
  'id, test_code, project_name, role, objective, tools_used, process_steps, result_metrics, evidence_links, status_badge'

export const KOLOM_LAB_SCENARIOS =
  'id, framework_name, scenario_title, scenario_description, tags, steps, result_summary, full_report_url, kode, kode_bahasa, repo_url'

export const KOLOM_EXPERIENCES =
  'id, company, role, period_start, period_end, location, responsibilities, achievements'

export const KOLOM_CERTIFICATIONS = 'id, name, issuer, year, credential_url'

export const KOLOM_EDUCATION = 'id, institution, degree, year'

export const KOLOM_TESTIMONIALS = 'id, quote, author_name, author_role, author_company, photo'

export const ambilSiteSettings = () => singleton<SiteSettings>('site_settings', KOLOM_SITE_SETTINGS)

export const ambilHero = () => singleton<Hero>('hero', KOLOM_HERO)

export const ambilAbout = () => singleton<About>('about', KOLOM_ABOUT)

export const ambilTools = () => koleksi<Tool>('tools', KOLOM_TOOLS)

export const ambilSkillCategories = () =>
  koleksi<SkillCategory>('skill_categories', KOLOM_SKILL_CATEGORIES)

export const ambilCaseStudies = () => koleksi<CaseStudy>('case_studies', KOLOM_CASE_STUDIES)

export const ambilLabScenarios = () => koleksi<LabScenario>('lab_scenarios', KOLOM_LAB_SCENARIOS)

export const ambilExperiences = () => koleksi<Experience>('experiences', KOLOM_EXPERIENCES)

export const ambilCertifications = () =>
  koleksi<Certification>('certifications', KOLOM_CERTIFICATIONS)

export const ambilEducation = () => koleksi<Education>('education', KOLOM_EDUCATION)

export const ambilTestimonials = () => koleksi<Testimonial>('testimonials', KOLOM_TESTIMONIALS)
