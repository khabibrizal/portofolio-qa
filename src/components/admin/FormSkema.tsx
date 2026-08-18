'use client'

import { useEffect, useState } from 'react'
import type { DefinisiKoleksi } from '@/lib/admin/skema/tipe'
import { buatSkemaKoleksi, petaErrorDariZod } from '@/lib/admin/skema/ke-zod'
import { nilaiAwalKoleksi, tulisNilai, type Jalur } from '@/lib/admin/nilai'
import { RenderField } from './field/RenderField'

/**
 * Mesin form: merender field sesuai `DefinisiKoleksi`, memvalidasi dengan
 * skema Zod turunan dari definisi yang sama (satu sumber, Task 3), dan
 * memanggil `onSimpan` HANYA ketika validasi lolos.
 *
 * Validasi klien di sini murni kenyamanan pengguna — Server Action (Task 6)
 * wajib memvalidasi ulang di server dengan skema yang sama sebelum menulis;
 * form ini tidak pernah dipercaya sebagai satu-satunya penjaga.
 */
export function FormSkema({
  definisi,
  nilaiAwal,
  onSimpan,
}: {
  definisi: DefinisiKoleksi
  nilaiAwal: Record<string, unknown>
  onSimpan: (nilai: Record<string, unknown>) => void | Promise<void>
}) {
  const [nilai, setNilai] = useState<Record<string, unknown>>(() => nilaiAwalKoleksi(definisi, nilaiAwal))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [adaPerubahan, setAdaPerubahan] = useState(false)

  // Spec §8: di sisi admin, kegagalan (di sini: menutup tab dengan perubahan
  // belum tersimpan) harus BERISIK. Listener cuma terpasang selama ada
  // perubahan yang belum disimpan, dan lepas begitu tersimpan atau komponen
  // dilepas — supaya tidak "berisik" untuk form yang memang belum diubah.
  useEffect(() => {
    if (!adaPerubahan) return

    const tangani = (peristiwa: BeforeUnloadEvent) => {
      peristiwa.preventDefault()
    }
    window.addEventListener('beforeunload', tangani)
    return () => window.removeEventListener('beforeunload', tangani)
  }, [adaPerubahan])

  function ubahNilai(jalur: Jalur, nilaiBaru: unknown) {
    setNilai((sebelumnya) => tulisNilai(sebelumnya, jalur, nilaiBaru) as Record<string, unknown>)
    setAdaPerubahan(true)
  }

  function tanganiSubmit(peristiwa: React.FormEvent<HTMLFormElement>) {
    peristiwa.preventDefault()

    const skema = buatSkemaKoleksi(definisi)
    const hasil = skema.safeParse(nilai)

    if (!hasil.success) {
      setErrors(petaErrorDariZod(hasil.error))
      return
    }

    setErrors({})
    setAdaPerubahan(false)
    onSimpan(hasil.data as Record<string, unknown>)
  }

  return (
    <form onSubmit={tanganiSubmit} noValidate>
      {definisi.field.map((field) => (
        <RenderField
          key={field.nama}
          definisi={field}
          jalur={[field.nama]}
          nilai={nilai[field.nama]}
          errors={errors}
          onChange={ubahNilai}
        />
      ))}

      <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface">
        Simpan
      </button>
    </form>
  )
}
