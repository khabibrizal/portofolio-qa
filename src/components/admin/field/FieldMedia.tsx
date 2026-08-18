'use client'

import { useState, type ChangeEvent } from 'react'
import type { DefinisiField } from '@/lib/admin/skema/tipe'
import type { Jalur } from '@/lib/admin/nilai'
import { unggahBerkas, type HasilUnggah } from '@/lib/admin/aksi'
import { urlMedia } from '@/lib/media'
import type { OnChangeField, PetaError } from './RenderField'

export type DimensiGambar = { width: number; height: number }
export type BacaDimensiGambar = (berkas: File) => Promise<DimensiGambar>
export type FungsiUnggahMedia = (formData: FormData) => Promise<HasilUnggah>

export type NilaiMedia = {
  path: string
  alt: { id: string; en: string }
  width?: number
  height?: number
}

/**
 * Membaca dimensi gambar dari BERKASNYA SENDIRI lewat decoder gambar
 * peramban — bukan diketik pengguna (D20).
 *
 * jsdom (lingkungan test komponen) tidak punya decoder gambar sungguhan:
 * `Image.onload` di sana tidak pernah terpanggil dengan `naturalWidth`/
 * `naturalHeight` yang benar. Implementasi ini karena itu TIDAK PERNAH
 * dijalankan oleh test — ia cuma parameter DEFAULT dari prop `bacaDimensi`
 * di `FieldMedia`. Test menyuntikkan fungsi palsu lewat prop itu (lihat
 * FieldMedia.test.tsx), sementara produksi tetap memakai fungsi ini karena
 * tidak ada pemanggil produksi yang mengoper `bacaDimensi` secara eksplisit.
 */
function bacaDimensiDariPeramban(berkas: File): Promise<DimensiGambar> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(berkas)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal membaca dimensi gambar'))
    }
    img.src = url
  })
}

/**
 * Field unggah gambar: pilih berkas, unggah, pratayang lewat `urlMedia()`,
 * dan `alt` dwibahasa WAJIB (aksesibilitas bukan opsional — D20, Fase 4).
 *
 * Dimensi (`width`/`height`) diambil dari berkasnya sendiri lewat
 * `bacaDimensi` (default `bacaDimensiDariPeramban` di atas), BUKAN field
 * yang bisa diisi tangan pengguna — konsisten dengan `unggah` (default
 * Server Action sungguhan `unggahBerkas`) yang juga bisa disuntik lewat
 * prop untuk kebutuhan test.
 *
 * Sengaja TIDAK menyimpan/menggabungkan seluruh objek `nilai` sendiri di
 * luar upload: setiap perubahan `alt` menulis lewat `onChange` ke jalur
 * SPESIFIK bahasanya (`[...jalur, 'alt', 'id']` / `[...jalur, 'alt', 'en']`)
 * — persis pola `FieldTerlokalisasi`/`FieldGrup` — supaya mengubah satu
 * bahasa tidak pernah menghapus bahasa lain (kegagalan yang sudah dua kali
 * terjadi di proyek ini).
 */
export function FieldMedia({
  definisi,
  jalur,
  nilai,
  errors,
  onChange,
  bacaDimensi = bacaDimensiDariPeramban,
  unggah = unggahBerkas,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: NilaiMedia
  errors: PetaError
  onChange: OnChangeField
  bacaDimensi?: BacaDimensiGambar
  unggah?: FungsiUnggahMedia
}) {
  const id = jalur.join('-')
  const idFile = `${id}-berkas`
  const idFileError = `${idFile}-error`
  const idAltId = `${id}-alt-id`
  const idAltEn = `${id}-alt-en`

  const [sedangUnggah, setSedangUnggah] = useState(false)
  const [pesanError, setPesanError] = useState<string | undefined>(undefined)

  const errorPath = errors[[...jalur, 'path'].join('.')]
  const errorAltId = errors[[...jalur, 'alt', 'id'].join('.')]
  const errorAltEn = errors[[...jalur, 'alt', 'en'].join('.')]
  const errorFileTampil = pesanError ?? errorPath

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
        // Gagal: TIDAK memanggil onChange sama sekali — path/dimensi lama
        // (kalau ada) harus tetap utuh, tidak boleh tertimpa nilai setengah
        // jadi (mis. path baru tapi dimensi lama, atau sebaliknya).
        setPesanError(hasil.error)
        return
      }

      const dimensi = await bacaDimensi(berkas)
      // Satu tulis atomik untuk path+width+height sekaligus (bukan tiga
      // panggilan onChange terpisah) — supaya konsumen (mis. FormSkema)
      // tidak pernah melihat keadaan antara path baru dengan dimensi lama.
      // `alt` saat ini SENGAJA disalin apa adanya (bukan direset): mengunggah
      // ulang berkas tidak boleh menghapus teks alternatif yang sudah
      // ditulis pengguna.
      onChange(jalur, { ...nilai, path: hasil.path, width: dimensi.width, height: dimensi.height })
    } finally {
      setSedangUnggah(false)
    }
  }

  const urlPratayang = urlMedia(nilai.path)
  const altPratayang = nilai.alt.id || nilai.alt.en

  return (
    <div className="mb-4">
      <span className="mb-1 block text-sm font-medium text-ink">
        {definisi.label}
        {definisi.wajib && <span className="text-critical"> *</span>}
      </span>
      {definisi.petunjuk && <p className="mb-2 text-xs text-ink-faint">{definisi.petunjuk}</p>}

      {urlPratayang && (
        // eslint-disable-next-line @next/next/no-img-element -- pratayang admin dari URL Storage dinamis; bukan halaman landing yang dioptimasi next/image.
        <img
          src={urlPratayang}
          alt={altPratayang}
          className="mb-2 h-24 w-auto rounded-md border border-border object-cover"
        />
      )}

      <label htmlFor={idFile} className="mb-1 block text-xs font-medium text-ink-soft">
        Berkas Gambar
      </label>
      <input
        id={idFile}
        type="file"
        accept="image/*"
        onChange={tanganiPilihBerkas}
        disabled={sedangUnggah}
        aria-invalid={Boolean(errorFileTampil)}
        aria-describedby={errorFileTampil ? idFileError : undefined}
        className="block w-full text-sm text-ink"
      />
      {sedangUnggah && <p className="mt-1 text-xs text-ink-faint">Mengunggah...</p>}
      {errorFileTampil && (
        <p id={idFileError} role="alert" className="mt-1 text-xs text-critical">
          {errorFileTampil}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <div>
          <label htmlFor={idAltId} className="mb-1 block text-xs font-medium text-ink-soft">
            Teks Alternatif (Indonesia)
          </label>
          <input
            id={idAltId}
            value={nilai.alt.id}
            onChange={(e) => onChange([...jalur, 'alt', 'id'], e.target.value)}
            aria-invalid={Boolean(errorAltId)}
            aria-describedby={errorAltId ? `${idAltId}-error` : undefined}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          {errorAltId && (
            <p id={`${idAltId}-error`} role="alert" className="mt-1 text-xs text-critical">
              {errorAltId}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={idAltEn} className="mb-1 block text-xs font-medium text-ink-soft">
            Teks Alternatif (English)
          </label>
          <input
            id={idAltEn}
            value={nilai.alt.en}
            onChange={(e) => onChange([...jalur, 'alt', 'en'], e.target.value)}
            aria-invalid={Boolean(errorAltEn)}
            aria-describedby={errorAltEn ? `${idAltEn}-error` : undefined}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          {errorAltEn && (
            <p id={`${idAltEn}-error`} role="alert" className="mt-1 text-xs text-critical">
              {errorAltEn}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
