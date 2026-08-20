import { Footer } from '@/components/layout/Footer'
import { Nav } from '@/components/layout/Nav'
import { About } from '@/components/sections/About'
import { AutomationLab } from '@/components/sections/AutomationLab'
import { CaseStudies } from '@/components/sections/CaseStudies'
import { Certifications } from '@/components/sections/Certifications'
import { Coverage } from '@/components/sections/Coverage'
import { FinalCta } from '@/components/sections/FinalCta'
import { Hero } from '@/components/sections/Hero'
import { Testimonials } from '@/components/sections/Testimonials'
import { Timeline } from '@/components/sections/Timeline'
import { TrustStrip } from '@/components/sections/TrustStrip'
import type { PageContent } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'

/**
 * Komposisi 12 section yang menyusun satu halaman utuh.
 *
 * Diekstrak jadi SATU komponen bersama, dipakai oleh landing
 * (`app/[locale]/page.tsx`) DAN pratinjau admin
 * (`app/admin/(terlindungi)/pratinjau/[locale]/page.tsx`) — bukan disalin
 * ke keduanya. Kalau disalin, keduanya akan menyimpang begitu ada section
 * ditambah atau diubah, dan pratinjau berhenti mencerminkan halaman
 * sungguhan justru saat paling dibutuhkan (Fase 2a Task 7, keputusan
 * struktural #1).
 *
 * Komponen ini TIDAK tahu dari mana `konten` berasal — hanya-terbit untuk
 * landing (`getPageContent`), tanpa-filter-status untuk pratinjau
 * (`getPageContentPratinjau`). Itu keputusan pemanggil, dibuat di titik
 * pengambilan data (`lib/content/get-page-content.ts`), bukan di sini.
 *
 * Section presentasional di `components/sections/` juga tetap tidak tahu
 * apa pun soal status draft (keputusan struktural #2 — bukan flag `draft`
 * yang dijalar ke dua belas komponen): mereka menerima data, meresolusikan
 * bahasa, dan menyembunyikan diri bila kosong, persis kontrak yang sudah
 * ada. Penanda visual "ini pratinjau, ada draft" adalah tanggung jawab
 * pemanggil (spanduk + panel ringkasan di halaman pratinjau), bukan
 * komponen ini maupun section di dalamnya.
 */
export function KomposisiHalaman({ konten, locale }: { konten: PageContent; locale: Locale }) {
  // Anchor yang benar-benar akan ada di halaman ini.
  //
  // Syarat tiap baris HARUS sama dengan syarat sembunyi-diri di komponen
  // section-nya, karena itulah yang menentukan apakah anchornya dirender.
  // Dihitung di sini, di tempat section-section itu dirangkai, supaya
  // keduanya tidak bisa menyimpang tanpa terlihat.
  const anchorTersedia = [
    konten.about ? 'tentang' : null,
    konten.skillCategories.length > 0 ? 'coverage' : null,
    konten.caseStudies.length > 0 ? 'studi-kasus' : null,
    konten.labScenarios.length > 0 ? 'automation-lab' : null,
    konten.experiences.length > 0 ? 'pengalaman' : null,
  ].filter((a): a is string => a !== null)

  return (
    <>
      <Nav settings={konten.siteSettings} locale={locale} anchorTersedia={anchorTersedia} />
      <main className="flex-1">
        <Hero hero={konten.hero} locale={locale} />
        <TrustStrip tools={konten.tools} locale={locale} />
        <About about={konten.about} locale={locale} />
        <Coverage skillCategories={konten.skillCategories} locale={locale} />
        <CaseStudies caseStudies={konten.caseStudies} locale={locale} />
        <AutomationLab labScenarios={konten.labScenarios} locale={locale} />
        <Timeline experiences={konten.experiences} locale={locale} />
        <Certifications
          certifications={konten.certifications}
          education={konten.education}
          locale={locale}
        />
        <Testimonials testimonials={konten.testimonials} locale={locale} />
        <FinalCta settings={konten.siteSettings} locale={locale} />
      </main>
      <Footer settings={konten.siteSettings} locale={locale} />
    </>
  )
}
