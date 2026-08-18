'use client'

import type { DefinisiField } from '@/lib/admin/skema/tipe'
import type { Jalur } from '@/lib/admin/nilai'

/**
 * Field teks satu baris atau multi-baris, terkendali penuh — nilainya
 * SELALU berasal dari prop `nilai`, tidak pernah dari state internal.
 *
 * Melayani jenis 'teks', 'teks-panjang' (textarea), 'tanggal' (input
 * type="date"), dan 'url' (input type="url") — cukup satu komponen karena
 * keempatnya sama-sama nilai string tunggal yang dirender dengan input HTML
 * bawaan.
 */
export function FieldTeks({
  definisi,
  jalur,
  nilai,
  error,
  onChange,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: string
  error?: string
  onChange: (jalur: Jalur, nilaiBaru: unknown) => void
}) {
  const id = jalur.join('-')
  const idError = `${id}-error`
  const multiBaris = definisi.jenis === 'teks-panjang'
  const tipeInput = definisi.jenis === 'tanggal' ? 'date' : definisi.jenis === 'url' ? 'url' : 'text'

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </label>

      {multiBaris ? (
        <textarea
          id={id}
          rows={4}
          value={nilai}
          onChange={(e) => onChange(jalur, e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? idError : undefined}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
      ) : (
        <input
          id={id}
          type={tipeInput}
          value={nilai}
          onChange={(e) => onChange(jalur, e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? idError : undefined}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
      )}

      {definisi.petunjuk && <p className="mt-1 text-xs text-ink-faint">{definisi.petunjuk}</p>}
      {error && (
        <p id={idError} role="alert" className="mt-1 text-xs text-critical">
          {error}
        </p>
      )}
    </div>
  )
}
