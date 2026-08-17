export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(nilai: unknown): nilai is Locale {
  return typeof nilai === 'string' && (LOCALES as readonly string[]).includes(nilai)
}

/**
 * Memilih locale dari header Accept-Language.
 * Bobot `q` dihormati, bukan sekadar urutan kemunculan — peramban kerap
 * mengirim daftar panjang yang urutannya tidak mencerminkan preferensi.
 */
export function pilihLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE

  const kandidat = acceptLanguage
    .split(',')
    .map((bagian) => {
      const [tag, ...params] = bagian.trim().split(';')
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2)
      return { bahasa: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q) : 1 }
    })
    .filter((k) => isLocale(k.bahasa) && !Number.isNaN(k.q))
    .sort((a, b) => b.q - a.q)

  const teratas = kandidat[0]
  return teratas && isLocale(teratas.bahasa) ? teratas.bahasa : DEFAULT_LOCALE
}
