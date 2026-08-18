'use client'

import { useState, type ChangeEvent } from 'react'
import type { DefinisiField } from '@/lib/admin/skema/tipe'
import type { Jalur } from '@/lib/admin/nilai'
import { unggahBerkas, type HasilUnggah } from '@/lib/admin/aksi'

export type FungsiUnggahBerkas = (formData: FormData) => Promise<HasilUnggah>

function formatUkuran(bita: number): string {
  if (bita < 1024) return `${bita} B`
  const kb = bita / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/**
 * Field unggah berkas PDF (mis. `site_settings.resume_pdf`).
 *
 * BEDA dengan `FieldMedia`: nilainya string BIASA — object path Storage
 * hasil `unggahBerkas`, bukan objek. Kolom seperti `resume_pdf` bertipe
 * `text`, bukan JSONB (D19/D20), jadi membungkusnya jadi `{ path }` di sini
 * justru akan membuat penyimpanan gagal. Tanpa `alt` dwibahasa maupun
 * dimensi karena PDF bukan gambar.
 *
 * `unggah` bisa disuntik lewat prop (default: Server Action sungguhan
 * `unggahBerkas`) — persis pola `bacaDimensi` di `FieldMedia` — supaya test
 * bisa mensimulasikan unggah berhasil/gagal tanpa menyentuh Supabase
 * sungguhan, tanpa mengubah perilaku produksi.
 */
export function FieldBerkas({
  definisi,
  jalur,
  nilai,
  error,
  onChange,
  unggah = unggahBerkas,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: string
  error?: string
  onChange: (jalur: Jalur, nilaiBaru: unknown) => void
  unggah?: FungsiUnggahBerkas
}) {
  const id = jalur.join('-')
  const idError = `${id}-error`
  const [sedangUnggah, setSedangUnggah] = useState(false)
  const [pesanError, setPesanError] = useState<string | undefined>(undefined)
  // Nama/ukuran berkas yang baru diunggah — TIDAK tersimpan di `nilai`
  // (yang cuma object path), jadi state lokal murni untuk tampilan sesi
  // berjalan ini. Berkas lama (dari sesi sebelumnya) hanya diketahui lewat
  // `nilai` (path-nya saja), ditampilkan sebagai fallback di bawah.
  const [berkasTerakhir, setBerkasTerakhir] = useState<{ nama: string; ukuran: number } | null>(null)

  async function tanganiPilihBerkas(e: ChangeEvent<HTMLInputElement>) {
    const berkas = e.target.files?.[0]
    // Reset input SEGERA supaya memilih berkas yang sama persis dua kali
    // berturut-turut tetap memicu `onChange` (browser tidak menembakkan
    // event `change` kalau value input tak berubah).
    e.target.value = ''
    if (!berkas) return

    setPesanError(undefined)
    setSedangUnggah(true)
    try {
      const formData = new FormData()
      formData.append('berkas', berkas)
      const hasil = await unggah(formData)

      if ('error' in hasil) {
        // Gagal: TIDAK memanggil onChange sama sekali — nilai lama (path
        // berkas yang sudah tersimpan sebelumnya) harus tetap utuh, tidak
        // boleh tertimpa nilai setengah jadi.
        setPesanError(hasil.error)
        return
      }

      setBerkasTerakhir({ nama: berkas.name, ukuran: berkas.size })
      onChange(jalur, hasil.path)
    } finally {
      setSedangUnggah(false)
    }
  }

  const errorTampil = pesanError ?? error

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </label>

      <input
        id={id}
        type="file"
        accept="application/pdf"
        onChange={tanganiPilihBerkas}
        disabled={sedangUnggah}
        aria-invalid={Boolean(errorTampil)}
        aria-describedby={errorTampil ? idError : undefined}
        className="block w-full text-sm text-ink"
      />

      {sedangUnggah && <p className="mt-1 text-xs text-ink-faint">Mengunggah...</p>}

      {berkasTerakhir ? (
        <p className="mt-1 text-xs text-ink-soft">
          {berkasTerakhir.nama} ({formatUkuran(berkasTerakhir.ukuran)})
        </p>
      ) : (
        nilai && <p className="mt-1 text-xs text-ink-soft">{nilai}</p>
      )}

      {definisi.petunjuk && <p className="mt-1 text-xs text-ink-faint">{definisi.petunjuk}</p>}
      {errorTampil && (
        <p id={idError} role="alert" className="mt-1 text-xs text-critical">
          {errorTampil}
        </p>
      )}
    </div>
  )
}
