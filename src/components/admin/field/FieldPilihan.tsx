'use client'

import type { DefinisiField } from '@/lib/admin/skema/tipe'
import type { Jalur } from '@/lib/admin/nilai'

/**
 * Dropdown terkendali untuk field `pilihan`. Opsi datang dari
 * `definisi.opsi` — komponen ini tidak tahu apa pun soal koleksi mana yang
 * memakainya.
 */
export function FieldPilihan({
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

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </label>
      <select
        id={id}
        value={nilai}
        onChange={(e) => onChange(jalur, e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? idError : undefined}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
      >
        <option value="" disabled>
          Pilih {definisi.label}
        </option>
        {(definisi.opsi ?? []).map((opsi) => (
          <option key={opsi.nilai} value={opsi.nilai}>
            {opsi.label}
          </option>
        ))}
      </select>
      {definisi.petunjuk && <p className="mt-1 text-xs text-ink-faint">{definisi.petunjuk}</p>}
      {error && (
        <p id={idError} role="alert" className="mt-1 text-xs text-critical">
          {error}
        </p>
      )}
    </div>
  )
}
