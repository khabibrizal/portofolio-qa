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
      {skills.map((skill) => {
        // Persentase itu OPSIONAL, dan penanganannya di sini menentukan apakah
        // halaman tampak rusak atau tidak.
        //
        // Versi sebelumnya selalu merender `{skill.proficiency_percent}%`. Untuk
        // keahlian tanpa angka, yang tampil adalah tanda "%" menggantung tanpa
        // bilangan apa pun, ditambah bilah kosong selebar 0% — terbaca seperti
        // data yang gagal dimuat.
        //
        // Dan mengisinya dengan angka karangan bukan jalan keluar: "Manual
        // Testing 90%" adalah klaim yang tidak diukur dari apa pun. Kalau
        // pemiliknya tidak memberi angka, keahlian itu ditampilkan apa adanya
        // sebagai nama — tanpa mengaku punya ukuran yang tidak ada.
        const punyaPersen =
          typeof skill.proficiency_percent === 'number' && skill.proficiency_percent > 0

        if (!punyaPersen) {
          return (
            <div key={skill.name} className="mb-2.5 flex items-baseline gap-2 text-sm">
              <span aria-hidden className="text-ink-faint">
                •
              </span>
              <span className="font-medium">{skill.name}</span>
            </div>
          )
        }

        return (
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
        )
      })}
    </div>
  )
}
