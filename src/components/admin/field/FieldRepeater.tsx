'use client'

import { useRef, useState } from 'react'
import type { DefinisiField } from '@/lib/admin/skema/tipe'
import { bacaNilai, type Jalur } from '@/lib/admin/nilai'
import { RenderField, type OnChangeField, type PetaError } from './RenderField'

/**
 * Repeater bersarang: tambah/hapus baris, naik/turun urutan.
 *
 * **Identitas baris.** Data baris (`nilai[i]`) tidak punya field id sendiri
 * (skema `skills` cuma `{name, proficiency_percent, years}`), jadi komponen
 * ini menjaga kunci sintetis sendiri di state lokal (`kunciBaris`, dibuat
 * sekali per baris lewat counter yang naik terus, bukan dari nilai baris
 * itu sendiri) dan memakainya sebagai React `key` — BUKAN indeks array.
 * Operasi tambah/hapus/naik/turun selalu menggeser `nilai` dan `kunciBaris`
 * BERSAMAAN pada posisi yang sama, jadi identitas satu baris tetap
 * menempel ke datanya sendiri sepanjang riwayat operasi, bukan ke posisi
 * tampilnya saat ini. Ini murni untuk kestabilan render (mis. state
 * tampilan seperti tab aktif di FieldTerlokalisasi ikut baris yang benar
 * saat baris lain dihapus/dipindah) — datanya sendiri sudah benar dengan
 * cara apa pun karena setiap operasi memakai indeks SAAT ITU JUGA, bukan
 * closure basi.
 */
export function FieldRepeater({
  definisi,
  jalur,
  nilai,
  errors,
  onChange,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: unknown[]
  errors: PetaError
  onChange: OnChangeField
}) {
  const anak = definisi.anak ?? []
  // Kunci baris awal (saat mount) aman dibuat dari indeks saat itu juga —
  // belum ada riwayat hapus/pindah yang bisa membingungkannya. Counter untuk
  // baris yang ditambahkan BELAKANGAN (lewat tombol "Tambah") diseed mulai
  // dari jumlah baris awal supaya tidak pernah bentrok dengan prefix
  // `baris-awal-` di atas. `useRef` di sini hanya pernah dibaca/ditulis di
  // dalam event handler (tambah/hapus/pindah), TIDAK PERNAH saat render —
  // membaca ref selama render dilarang react-hooks/refs.
  const idBerikutnya = useRef(nilai.length)
  const [kunciBaris, setKunciBaris] = useState<string[]>(() => nilai.map((_, i) => `baris-awal-${i}`))

  function buatKunciBaru() {
    idBerikutnya.current += 1
    return `baris-${idBerikutnya.current}`
  }

  function barisKosong(): Record<string, unknown> {
    const baris: Record<string, unknown> = {}
    for (const field of anak) baris[field.nama] = undefined
    return baris
  }

  function tambah() {
    onChange(jalur, [...nilai, barisKosong()])
    setKunciBaris((prev) => [...prev, buatKunciBaru()])
  }

  function hapus(index: number) {
    onChange(
      jalur,
      nilai.filter((_, i) => i !== index),
    )
    setKunciBaris((prev) => prev.filter((_, i) => i !== index))
  }

  function pindah(index: number, arah: -1 | 1) {
    const tujuan = index + arah
    if (tujuan < 0 || tujuan >= nilai.length) return

    const nilaiBaru = [...nilai]
    ;[nilaiBaru[index], nilaiBaru[tujuan]] = [nilaiBaru[tujuan], nilaiBaru[index]]
    onChange(jalur, nilaiBaru)

    setKunciBaris((prev) => {
      const baru = [...prev]
      ;[baru[index], baru[tujuan]] = [baru[tujuan], baru[index]]
      return baru
    })
  }

  return (
    <div className="mb-4">
      <span className="mb-2 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </span>
      {definisi.petunjuk && <p className="mb-2 text-xs text-ink-faint">{definisi.petunjuk}</p>}

      <div className="flex flex-col gap-3">
        {nilai.map((baris, i) => (
          <div
            key={kunciBaris[i]}
            role="group"
            aria-label={`Baris ${i + 1}`}
            className="rounded-md border border-border bg-surface p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-faint">Baris {i + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => pindah(i, -1)}
                  disabled={i === 0}
                  aria-label={`Naikkan baris ${i + 1}`}
                  className="rounded px-2 py-1 text-xs text-ink-soft disabled:opacity-40"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => pindah(i, 1)}
                  disabled={i === nilai.length - 1}
                  aria-label={`Turunkan baris ${i + 1}`}
                  className="rounded px-2 py-1 text-xs text-ink-soft disabled:opacity-40"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => hapus(i)}
                  aria-label={`Hapus baris ${i + 1}`}
                  className="rounded px-2 py-1 text-xs text-critical"
                >
                  Hapus
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {anak.map((fieldAnak) => (
                <RenderField
                  key={fieldAnak.nama}
                  definisi={fieldAnak}
                  jalur={[...jalur, i, fieldAnak.nama]}
                  nilai={bacaNilai(baris, [fieldAnak.nama])}
                  errors={errors}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={tambah}
        className="mt-2 rounded-md border border-primary px-3 py-1.5 text-sm text-primary"
      >
        Tambah {definisi.label}
      </button>
    </div>
  )
}
