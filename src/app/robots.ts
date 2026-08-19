import type { MetadataRoute } from 'next'
import { KONTEN_MASIH_CONTOH, situsUrl } from '@/lib/seo'

/**
 * robots.txt.
 *
 * `/admin` selalu dilarang — bukan sebagai pengaman (penjaganya adalah proxy
 * sesi dan RLS), melainkan supaya halaman login tidak muncul di hasil
 * pencarian atas nama pemiliknya.
 *
 * Selama konten masih contoh, seluruh situs dilarang dirayapi, sejalan dengan
 * `noindex` di metadata halaman. Keduanya dikendalikan satu konstanta di
 * `src/lib/seo.ts` supaya tak mungkin berbeda pendapat.
 */
export default function robots(): MetadataRoute.Robots {
  const basis = situsUrl()

  if (KONTEN_MASIH_CONTOH) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/admin' }],
    sitemap: `${basis}/sitemap.xml`,
    host: basis,
  }
}
