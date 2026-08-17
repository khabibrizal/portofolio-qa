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
