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
