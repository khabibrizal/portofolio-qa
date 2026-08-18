import type { DefinisiKoleksi } from './tipe'
import { about } from './about'
import { certifications } from './certifications'
import { education } from './education'
import { hero } from './hero'
import { siteSettings } from './site-settings'
import { skillCategories } from './skill-categories'
import { testimonials } from './testimonials'
import { tools } from './tools'

/**
 * Registry slug -> definisi koleksi.
 *
 * Ini satu-satunya tempat menambah koleksi baru di Fase 2b: navigasi admin,
 * rute `[koleksi]`, dan validator turunannya semua membaca dari sini —
 * bukan dari daftar keras di komponen.
 *
 * Urutan mengikuti urutan tampil di landing (`KomposisiHalaman.tsx`) bila
 * memungkinkan: Hero -> TrustStrip (tools) -> About -> Coverage
 * (skillCategories) -> ... -> Certifications (certifications, education)
 * -> Testimonials. Tiga koleksi kompleks di antaranya (case_studies,
 * lab_scenarios, experiences) belum terdaftar di sini — itu Task 5.
 */
export const registryKoleksi: Record<string, DefinisiKoleksi> = {
  [siteSettings.slug]: siteSettings,
  [hero.slug]: hero,
  [tools.slug]: tools,
  [about.slug]: about,
  [skillCategories.slug]: skillCategories,
  [certifications.slug]: certifications,
  [education.slug]: education,
  [testimonials.slug]: testimonials,
}

/**
 * Mencari definisi koleksi berdasarkan slug URL (mis. dari `[koleksi]`
 * pada rute admin). Melempar, bukan mengembalikan `undefined`, karena slug
 * yang tak dikenal di sini selalu berarti bug pemanggil (typo rute, atau
 * koleksi yang belum didaftarkan) — bukan keadaan normal yang harus
 * ditangani pemanggil satu per satu.
 */
export function cariDefinisiKoleksi(slug: string): DefinisiKoleksi {
  const definisi = registryKoleksi[slug]
  if (!definisi) {
    throw new Error(`Koleksi dengan slug "${slug}" tidak terdaftar di registry skema`)
  }
  return definisi
}
