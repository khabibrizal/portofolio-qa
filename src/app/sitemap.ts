import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n/locales'
import { KONTEN_MASIH_CONTOH, situsUrl } from '@/lib/seo'

/**
 * Sitemap: satu entri per bahasa, masing-masing menunjuk padanannya lewat
 * `alternates.languages` (D12 — i18n berbasis path, dua URL terindeks).
 *
 * Selama konten masih contoh, sitemap sengaja dikosongkan. Menyodorkan URL
 * ke mesin pencari sambil menandainya `noindex` adalah sinyal bertentangan;
 * lebih jujur tidak menyodorkannya sama sekali sampai isinya sungguhan.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (KONTEN_MASIH_CONTOH) return []

  const basis = situsUrl()
  const diperbarui = new Date()

  return LOCALES.map((locale) => ({
    url: `${basis}/${locale}`,
    lastModified: diperbarui,
    changeFrequency: 'monthly' as const,
    priority: 1,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${basis}/${l}`])),
    },
  }))
}
