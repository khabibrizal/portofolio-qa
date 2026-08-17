import { describe, expect, it } from 'vitest'
import type { PageContent } from '@/lib/content/types'

const KUNCI_WAJIB = [
  'siteSettings', 'hero', 'about', 'tools', 'skillCategories', 'caseStudies',
  'labScenarios', 'experiences', 'certifications', 'education', 'testimonials',
] as const

describe('bentuk PageContent', () => {
  it('memuat kunci untuk setiap section', () => {
    const kosong: PageContent = {
      siteSettings: null, hero: null, about: null, tools: [], skillCategories: [],
      caseStudies: [], labScenarios: [], experiences: [], certifications: [],
      education: [], testimonials: [],
    }
    expect(Object.keys(kosong).sort()).toEqual([...KUNCI_WAJIB].sort())
  })
})
