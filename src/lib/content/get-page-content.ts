import {
  ambilAbout, ambilCaseStudies, ambilCertifications, ambilEducation, ambilExperiences,
  ambilHero, ambilLabScenarios, ambilSiteSettings, ambilSkillCategories, ambilTestimonials,
  ambilTools,
} from './queries'
import {
  ambilCaseStudiesPratinjau, ambilCertificationsPratinjau, ambilEducationPratinjau,
  ambilExperiencesPratinjau, ambilLabScenariosPratinjau, ambilSkillCategoriesPratinjau,
  ambilTestimonialsPratinjau, ambilToolsPratinjau,
  type DenganStatus,
} from './queries-pratinjau'
import type {
  CaseStudy, Certification, Education, Experience, LabScenario, PageContent, SkillCategory,
  Testimonial, Tool,
} from './types'

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

/**
 * Jalur LANDING — hanya-terbit, klien anonim (lewat `queries.ts`). Dipakai
 * SATU-SATUNYA oleh `app/[locale]/page.tsx`. Tidak pernah membaca cookie,
 * tidak pernah melihat draft.
 */
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

/**
 * Bentuk konten pratinjau: sama seperti `PageContent`, tapi setiap baris
 * koleksi (bukan singleton — `site_settings`/`hero`/`about` tidak punya
 * konsep draft, lihat `queries-pratinjau.ts`) membawa `status`-nya sendiri,
 * supaya pemanggil (panel ringkasan draft) tahu entri mana yang belum terbit.
 */
export type PageContentPratinjau = Omit<
  PageContent,
  | 'tools' | 'skillCategories' | 'caseStudies' | 'labScenarios' | 'experiences'
  | 'certifications' | 'education' | 'testimonials'
> & {
  tools: DenganStatus<Tool>[]
  skillCategories: DenganStatus<SkillCategory>[]
  caseStudies: DenganStatus<CaseStudy>[]
  labScenarios: DenganStatus<LabScenario>[]
  experiences: DenganStatus<Experience>[]
  certifications: DenganStatus<Certification>[]
  education: DenganStatus<Education>[]
  testimonials: DenganStatus<Testimonial>[]
}

/**
 * Jalur PRATINJAU — TANPA filter status, klien berbasis cookie (lewat
 * `queries-pratinjau.ts`). Dipakai SATU-SATUNYA oleh
 * `app/admin/(terlindungi)/pratinjau/[locale]/page.tsx`, yang sudah berada
 * di bawah penjaga sesi (middleware + pemeriksaan ulang di layout admin).
 *
 * Sengaja fungsi TERPISAH dari `getPageContent()` di atas, bukan satu
 * fungsi dengan parameter "sertakan draft?": memisahkan fungsi berarti
 * jalur landing tidak bisa diam-diam mulai membawa draft hanya karena satu
 * argumen lupa diisi di suatu tempat — satu-satunya cara landing menampilkan
 * draft adalah mengedit `app/[locale]/page.tsx` untuk memanggil fungsi LAIN
 * ini secara eksplisit. Itu persis yang dibuktikan TIDAK terjadi oleh uji
 * daya gigit Task 7: `draft-tidak-tampil.spec.ts` dan kasus 7
 * `admin-pratinjau.spec.ts` harus GAGAL kalau landing ditukar memakai
 * fungsi ini.
 */
export async function getPageContentPratinjau(): Promise<PageContentPratinjau> {
  const [
    siteSettings, hero, about, tools, skillCategories, caseStudies,
    labScenarios, experiences, certifications, education, testimonials,
  ] = await Promise.all([
    aman('site_settings', ambilSiteSettings(), null),
    aman('hero', ambilHero(), null),
    aman('about', ambilAbout(), null),
    aman('tools (pratinjau)', ambilToolsPratinjau(), []),
    aman('skill_categories (pratinjau)', ambilSkillCategoriesPratinjau(), []),
    aman('case_studies (pratinjau)', ambilCaseStudiesPratinjau(), []),
    aman('lab_scenarios (pratinjau)', ambilLabScenariosPratinjau(), []),
    aman('experiences (pratinjau)', ambilExperiencesPratinjau(), []),
    aman('certifications (pratinjau)', ambilCertificationsPratinjau(), []),
    aman('education (pratinjau)', ambilEducationPratinjau(), []),
    aman('testimonials (pratinjau)', ambilTestimonialsPratinjau(), []),
  ])

  return {
    siteSettings, hero, about, tools, skillCategories, caseStudies,
    labScenarios, experiences, certifications, education, testimonials,
  }
}
