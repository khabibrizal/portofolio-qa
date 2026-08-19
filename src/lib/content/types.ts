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
  /** Domisili yang tampil di blok kontak CV. */
  location: string | null
  languages: Bahasa[]
  updated_at: string
}

export type Bahasa = { name: string; level: string }

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
  /** Cuplikan kode; apa adanya, tidak dwibahasa. */
  kode: string | null
  kode_bahasa: string | null
  repo_url: string | null
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
