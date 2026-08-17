import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8')

const WARNA_WAJIB: Record<string, string> = {
  '--color-bg': '#f6f7f9',
  '--color-surface': '#ffffff',
  '--color-ink': '#12181f',
  '--color-ink-soft': '#54606d',
  '--color-ink-faint': '#8a93a0',
  '--color-primary': '#1e3a5f',
  '--color-primary-dark': '#122741',
  '--color-primary-tint': '#eaf0f6',
  '--color-pass': '#1e8a5f',
  '--color-pass-bg': '#e7f4ee',
  '--color-critical': '#b23a2e',
  '--color-major': '#b9812b',
  '--color-border': '#e3e7ed',
}

const FONT_WAJIB = ['--font-display', '--font-body', '--font-mono']

describe('token desain dari mockup', () => {
  it('mendefinisikan setiap token warna dengan nilai yang tepat', () => {
    for (const [token, nilai] of Object.entries(WARNA_WAJIB)) {
      const cocok = css.match(new RegExp(`${token}\\s*:\\s*([^;]+);`))
      expect(cocok, `token ${token} tidak ditemukan di globals.css`).not.toBeNull()
      expect(cocok![1].trim().toLowerCase(), `nilai ${token} tidak sesuai mockup`).toBe(nilai)
    }
  })

  it('mendefinisikan tiga keluarga font', () => {
    for (const token of FONT_WAJIB) {
      expect(css, `token ${token} tidak ditemukan`).toContain(token)
    }
  })
})
