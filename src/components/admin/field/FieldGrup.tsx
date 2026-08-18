'use client'

import type { DefinisiField } from '@/lib/admin/skema/tipe'
import { bacaNilai, type Jalur } from '@/lib/admin/nilai'
import { RenderField, type OnChangeField, type PetaError } from './RenderField'

/**
 * Grup: satu objek berfield tetap (bukan array seperti `FieldRepeater`) —
 * dipakai untuk field seperti `hero.cta_primary` (`{label, link}`).
 *
 * Sengaja TIDAK menyimpan state atau logika penggabungan nilai sendiri.
 * Setiap field anak dirender lewat `RenderField` (persis pola
 * `FieldRepeater`, supaya tidak menduplikasi switch jenis field) dan
 * `onChange`-nya diteruskan APA ADANYA dengan jalur absolut penuh
 * (`[...jalur, fieldAnak.nama, ...]`) — penggabungan imutabel yang menjaga
 * anak-anak lain tetap utuh sepenuhnya jadi tanggung jawab `tulisNilai` di
 * level form (lihat `FormSkema`/`tulisNilai`), BUKAN komponen ini. Kalau
 * `FieldGrup` mencoba "membantu" dengan menyusun ulang seluruh objek sendiri
 * di sini, itu justru berisiko menimpa anak yang tidak sedang diubah.
 */
export function FieldGrup({
  definisi,
  jalur,
  nilai,
  errors,
  onChange,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: Record<string, unknown>
  errors: PetaError
  onChange: OnChangeField
}) {
  const anak = definisi.anak ?? []

  return (
    <div className="mb-4">
      <span className="mb-2 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </span>
      {definisi.petunjuk && <p className="mb-2 text-xs text-ink-faint">{definisi.petunjuk}</p>}

      <div role="group" aria-label={definisi.label} className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
        {anak.map((fieldAnak) => (
          <RenderField
            key={fieldAnak.nama}
            definisi={fieldAnak}
            jalur={[...jalur, fieldAnak.nama]}
            nilai={bacaNilai(nilai, [fieldAnak.nama])}
            errors={errors}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}
