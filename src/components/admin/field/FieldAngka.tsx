'use client'

import type { DefinisiField } from '@/lib/admin/skema/tipe'
import type { Jalur } from '@/lib/admin/nilai'

/**
 * Field angka terkendali. Nilai semantiknya adalah `number | undefined`
 * (kosong = belum diisi), tapi DOM-nya selalu diberi string ('' saat
 * kosong) supaya React tidak pernah beralih controlled/uncontrolled.
 */
export function FieldAngka({
  definisi,
  jalur,
  nilai,
  error,
  onChange,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: number | undefined
  error?: string
  onChange: (jalur: Jalur, nilaiBaru: unknown) => void
}) {
  const id = jalur.join('-')
  const idError = `${id}-error`

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </label>
      <input
        id={id}
        type="number"
        min={definisi.min}
        max={definisi.max}
        value={nilai ?? ''}
        onChange={(e) => {
          const teks = e.target.value
          onChange(jalur, teks === '' ? undefined : Number(teks))
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? idError : undefined}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
      />
      {definisi.petunjuk && <p className="mt-1 text-xs text-ink-faint">{definisi.petunjuk}</p>}
      {error && (
        <p id={idError} role="alert" className="mt-1 text-xs text-critical">
          {error}
        </p>
      )}
    </div>
  )
}
