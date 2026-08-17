'use client'

import { useEffect, useRef, useState } from 'react'
import type { Skill } from '@/lib/content/types'

/**
 * Bar skill yang menganimasikan lebarnya saat pertama kali masuk viewport.
 *
 * Persentase selalu ditulis sebagai teks di DOM (bukan hanya lebar CSS) agar
 * E2E bisa membaca angkanya tanpa bergantung pada timing animasi. Saat
 * pengguna meminta prefers-reduced-motion, bar langsung tampil pada lebar
 * akhirnya tanpa transisi maupun menunggu IntersectionObserver.
 */
export function SkillBars({ skills }: { skills: Skill[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [terlihat, setTerlihat] = useState(false)
  // Inisialisasi lazy — dibaca langsung saat render pertama di klien, bukan
  // lewat setState di dalam efek (yang memicu render tambahan tanpa perlu).
  const [gerakDikurangi, setGerakDikurangi] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setGerakDikurangi(e.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setTerlihat(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const lebarAkhirTampil = terlihat || gerakDikurangi

  return (
    <div ref={containerRef}>
      {skills.map((skill) => (
        <div key={skill.name} className="mb-4">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium">{skill.name}</span>
            <span className="font-mono text-[12.5px] text-ink-faint">
              {skill.proficiency_percent}%
            </span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full bg-border">
            <div
              className={
                gerakDikurangi
                  ? 'h-full rounded-full bg-primary'
                  : 'h-full rounded-full bg-primary transition-[width] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]'
              }
              style={{ width: lebarAkhirTampil ? `${skill.proficiency_percent}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
