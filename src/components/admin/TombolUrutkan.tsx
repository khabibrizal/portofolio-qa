'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { urutkan } from '@/lib/admin/aksi'

/**
 * Naik/turun urutan SATU ENTRI di daftar `[koleksi]` — beda dari tombol naik/
 * turun di `FieldRepeater` (Task 4), yang mengurutkan BARIS di dalam satu
 * entri. Ini mengurutkan ANTAR entri lewat Server Action `urutkan`.
 */
export function TombolUrutkan({
  koleksi,
  id,
  bisaNaik,
  bisaTurun,
}: {
  koleksi: string
  id: string
  bisaNaik: boolean
  bisaTurun: boolean
}) {
  const router = useRouter()
  const [sedangProses, setSedangProses] = useState(false)

  async function pindah(arah: 'naik' | 'turun') {
    setSedangProses(true)
    await urutkan(koleksi, id, arah)
    setSedangProses(false)
    router.refresh()
  }

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => pindah('naik')}
        disabled={!bisaNaik || sedangProses}
        aria-label="Naikkan urutan entri"
        className="rounded px-2 py-1 text-xs text-ink-soft disabled:opacity-40"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={() => pindah('turun')}
        disabled={!bisaTurun || sedangProses}
        aria-label="Turunkan urutan entri"
        className="rounded px-2 py-1 text-xs text-ink-soft disabled:opacity-40"
      >
        ▼
      </button>
    </div>
  )
}
