'use client'

import { useState } from 'react'
import type { DefinisiField } from '@/lib/admin/skema/tipe'
import type { Jalur } from '@/lib/admin/nilai'

type NilaiTerlokalisasi = { id: string; en: string }
type KodeBahasa = 'id' | 'en'

const LABEL_BAHASA: Record<KodeBahasa, string> = { id: 'Indonesia', en: 'English' }

/**
 * Field dwibahasa: dua tab (ID | EN) di atas satu kotak teks.
 *
 * Dua aturan yang tidak boleh dilanggar (spec §"perilaku wajib diuji"):
 *
 * 1. Mengetik di satu tab tidak boleh menghapus tab yang lain. Ini otomatis
 *    benar karena `onChange` selalu menulis ke jalur SPESIFIK bahasa yang
 *    sedang aktif (`[...jalur, tabAktif]`) lewat `tulisNilai` yang imutabel —
 *    bahasa yang tidak disentuh tidak pernah ikut ditulis ulang. `tabAktif`
 *    sendiri murni state tampilan (tab mana yang terlihat), bukan data.
 * 2. Bahasa yang belum terisi punya penanda pada TOMBOL TAB-nya sendiri
 *    (bukan cuma pada kotak teks yang lagi aktif), lewat `aria-label` dan
 *    tanda titik — supaya kelalaian mengisi satu bahasa terlihat tanpa
 *    harus mengeklik tabnya lebih dulu.
 */
export function FieldTerlokalisasi({
  definisi,
  jalur,
  nilai,
  errors,
  onChange,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: NilaiTerlokalisasi
  errors: { id?: string; en?: string }
  onChange: (jalur: Jalur, nilaiBaru: unknown) => void
}) {
  const [tabAktif, setTabAktif] = useState<KodeBahasa>('id')
  const idInput = `${jalur.join('-')}-${tabAktif}`
  const idError = `${idInput}-error`
  const errorAktif = errors[tabAktif]

  return (
    <div className="mb-4">
      <span className="mb-1 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </span>

      <div role="tablist" className="mb-2 flex gap-1 border-b border-border">
        {(['id', 'en'] as const).map((bahasa) => {
          const kosong = !nilai[bahasa]?.trim()
          const aktif = tabAktif === bahasa
          return (
            <button
              key={bahasa}
              type="button"
              role="tab"
              aria-selected={aktif}
              aria-label={kosong ? `Tab ${LABEL_BAHASA[bahasa]} (belum diisi)` : `Tab ${LABEL_BAHASA[bahasa]}`}
              onClick={() => setTabAktif(bahasa)}
              className={
                aktif
                  ? 'border-b-2 border-primary px-3 py-1.5 text-sm font-medium text-primary'
                  : 'border-b-2 border-transparent px-3 py-1.5 text-sm text-ink-soft'
              }
            >
              {LABEL_BAHASA[bahasa]}
              {kosong && (
                <span aria-hidden="true" className="ml-1 text-critical">
                  ●
                </span>
              )}
            </button>
          )
        })}
      </div>

      <label htmlFor={idInput} className="sr-only">
        {`${definisi.label} (${LABEL_BAHASA[tabAktif]})`}
      </label>
      <input
        id={idInput}
        value={nilai[tabAktif] ?? ''}
        onChange={(e) => onChange([...jalur, tabAktif], e.target.value)}
        aria-invalid={Boolean(errorAktif)}
        aria-describedby={errorAktif ? idError : undefined}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
      />

      {definisi.petunjuk && <p className="mt-1 text-xs text-ink-faint">{definisi.petunjuk}</p>}
      {errorAktif && (
        <p id={idError} role="alert" className="mt-1 text-xs text-critical">
          {errorAktif}
        </p>
      )}
    </div>
  )
}
