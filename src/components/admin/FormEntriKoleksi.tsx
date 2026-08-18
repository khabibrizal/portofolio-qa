'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { BarisEntri } from '@/lib/admin/entri'
import { hapus, jadikanDraft, simpan, terbitkan } from '@/lib/admin/aksi'
import type { DefinisiKoleksi } from '@/lib/admin/skema/tipe'
import { FormSkema } from './FormSkema'

type Pesan = { jenis: 'sukses' | 'gagal'; teks: string }

/**
 * Pembungkus `FormSkema` untuk satu entri koleksi: menghubungkan mesin form
 * generik (Task 4, tidak tahu apa pun soal Supabase/status) ke Server Action
 * CRUD (Task 6). Juga menampung tombol terbitkan/jadikan-draft/hapus — itu
 * konsep milik koleksi, bukan milik mesin form, jadi sengaja tidak masuk
 * `FormSkema` sendiri.
 */
export function FormEntriKoleksi({
  definisi,
  id,
  entri,
}: {
  definisi: DefinisiKoleksi
  id: string
  entri: BarisEntri | null
}) {
  const router = useRouter()
  const [pesan, setPesan] = useState<Pesan | null>(null)
  const [sedangProses, setSedangProses] = useState(false)

  async function tanganiSimpan(nilai: Record<string, unknown>) {
    setSedangProses(true)
    setPesan(null)
    const hasil = await simpan(definisi.slug, id, nilai)
    setSedangProses(false)

    if ('error' in hasil) {
      setPesan({ jenis: 'gagal', teks: hasil.error })
      return
    }

    if (id === 'baru') {
      // Entri baru selalu tersimpan sebagai draft (default kolom) — pindah ke
      // rute editnya sendiri supaya pengguna bisa lanjut menerbitkan/mengubah
      // tanpa harus mencarinya lagi di daftar.
      router.push(`/admin/${definisi.slug}/${hasil.id}`)
      return
    }

    setPesan({ jenis: 'sukses', teks: 'Tersimpan.' })
    router.refresh()
  }

  async function tanganiTerbitkan() {
    setSedangProses(true)
    setPesan(null)
    const hasil = await terbitkan(definisi.slug, id)
    setSedangProses(false)
    if (hasil && 'error' in hasil) {
      setPesan({ jenis: 'gagal', teks: hasil.error })
      return
    }
    router.refresh()
  }

  async function tanganiJadikanDraft() {
    setSedangProses(true)
    setPesan(null)
    const hasil = await jadikanDraft(definisi.slug, id)
    setSedangProses(false)
    if (hasil && 'error' in hasil) {
      setPesan({ jenis: 'gagal', teks: hasil.error })
      return
    }
    router.refresh()
  }

  async function tanganiHapus() {
    setSedangProses(true)
    setPesan(null)
    const hasil = await hapus(definisi.slug, id)
    setSedangProses(false)
    if (hasil && 'error' in hasil) {
      setPesan({ jenis: 'gagal', teks: hasil.error })
      return
    }
    router.push(`/admin/${definisi.slug}`)
  }

  const nilaiAwal: Record<string, unknown> = entri ?? {}

  return (
    <div className="flex flex-col gap-4">
      {entri && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
          {entri.status === 'draft' ? (
            <span className="rounded-full border border-major px-2.5 py-1 font-mono text-[11px] font-semibold text-major">
              Draft
            </span>
          ) : (
            <span className="rounded-full bg-pass-bg px-2.5 py-1 font-mono text-[11px] font-semibold text-pass">
              Terbit
            </span>
          )}

          <div className="ml-auto flex gap-2">
            {entri.status === 'draft' ? (
              <button
                type="button"
                onClick={tanganiTerbitkan}
                disabled={sedangProses}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-50"
              >
                Terbitkan
              </button>
            ) : (
              <button
                type="button"
                onClick={tanganiJadikanDraft}
                disabled={sedangProses}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft disabled:opacity-50"
              >
                Jadikan Draft
              </button>
            )}
            <button
              type="button"
              onClick={tanganiHapus}
              disabled={sedangProses}
              className="rounded-md border border-critical px-3 py-1.5 text-sm text-critical disabled:opacity-50"
            >
              Hapus
            </button>
          </div>
        </div>
      )}

      {pesan && (
        <p
          role={pesan.jenis === 'gagal' ? 'alert' : 'status'}
          className={pesan.jenis === 'gagal' ? 'text-sm text-critical' : 'text-sm text-pass'}
        >
          {pesan.teks}
        </p>
      )}

      <FormSkema definisi={definisi} nilaiAwal={nilaiAwal} onSimpan={tanganiSimpan} />
    </div>
  )
}
