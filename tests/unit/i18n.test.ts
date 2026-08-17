import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES, isLocale, pilihLocale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

describe('locales', () => {
  it('mendukung tepat dua bahasa dengan default Indonesia', () => {
    expect(LOCALES).toEqual(['id', 'en'])
    expect(DEFAULT_LOCALE).toBe('id')
  })

  it('mengenali locale yang sah', () => {
    expect(isLocale('id')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('jv')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

describe('pilihLocale dari Accept-Language', () => {
  it('memilih Inggris ketika diminta lebih dulu', () => {
    expect(pilihLocale('en-US,en;q=0.9,id;q=0.8')).toBe('en')
  })

  it('memilih Indonesia ketika diminta lebih dulu', () => {
    expect(pilihLocale('id-ID,id;q=0.9,en;q=0.8')).toBe('id')
  })

  it('menghormati bobot q, bukan urutan kemunculan', () => {
    expect(pilihLocale('en;q=0.3,id;q=0.9')).toBe('id')
  })

  it('jatuh ke default saat header tidak dikenal atau kosong', () => {
    expect(pilihLocale('fr-FR,de;q=0.8')).toBe('id')
    expect(pilihLocale('')).toBe('id')
    expect(pilihLocale(null)).toBe('id')
  })
})

describe('teks', () => {
  const halo = { id: 'Halo', en: 'Hello' }

  it('mengambil bahasa yang diminta', () => {
    expect(teks(halo, 'id')).toBe('Halo')
    expect(teks(halo, 'en')).toBe('Hello')
  })

  it('jatuh ke bahasa lain ketika yang diminta kosong', () => {
    expect(teks({ id: '', en: 'Hello' }, 'id')).toBe('Hello')
    expect(teks({ id: 'Halo', en: '   ' }, 'en')).toBe('Halo')
  })

  it('mengembalikan string kosong, bukan melempar, saat nilainya tidak ada', () => {
    expect(teks(null, 'id')).toBe('')
    expect(teks(undefined, 'en')).toBe('')
    expect(teks({ id: '', en: '' }, 'id')).toBe('')
  })
})
