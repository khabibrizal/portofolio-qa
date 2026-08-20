'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { DialogKonfirmasi, type JenisKonfirmasi } from './DialogKonfirmasi'
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
  const paramPencarian = useSearchParams()

  /**
   * Pesan awal dibaca dari `?tersimpan=baru`.
   *
   * Menyimpan entri baru memindahkan pengguna ke rute editnya. Tanpa penanda
   * ini, satu-satunya hal yang terjadi setelah menekan Simpan adalah alamat
   * halaman berubah — tanpa satu kata pun. Itu bentuk paling sering dibaca
   * sebagai "sepertinya tidak terjadi apa-apa", dan orang menekan Simpan lagi.
   *
   * `useState` dengan nilai awal, BUKAN `useEffect`: pesannya harus sudah ada
   * pada render pertama, dan tetap bisa ditimpa pesan aksi berikutnya.
   */
  const [pesan, setPesan] = useState<Pesan | null>(
    paramPencarian.get('tersimpan') === 'baru'
      ? { jenis: 'sukses', teks: 'Tersimpan sebagai draft. Terbitkan bila sudah siap tampil publik.' }
      : null,
  )
  const [sedangProses, setSedangProses] = useState(false)

  /**
   * Aksi yang harus dikonfirmasi lebih dulu — dan hanya yang PUNYA AKIBAT.
   *
   * `Simpan` sengaja TIDAK ada di sini. Menyimpan adalah hal yang memang
   * diinginkan orang saat menekan tombolnya; meminta konfirmasi untuk itu
   * menambah satu ketukan tanpa menambah keamanan, dan justru melatih orang
   * menekan "Ya" tanpa membaca — yang membuat konfirmasi di tempat yang benar
   * ikut kehilangan artinya. Kejelasan untuk Simpan datang dari pesan SESUDAH
   * tersimpan, bukan pertanyaan sebelumnya.
   */
  const [konfirmasi, setKonfirmasi] = useState<null | {
    judul: string
    keterangan: string
    labelAksi: string
    jenis: JenisKonfirmasi
    jalankan: () => Promise<void>
  }>(null)

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
      // Penanda `?tersimpan=baru` dibawa ke rute edit supaya halaman tujuan
      // bisa mengabarkan hasilnya. Tanpa itu, menekan Simpan pada entri baru
      // hanya mengganti alamat halaman tanpa satu kata pun — hasil yang paling
      // sering dibaca sebagai "sepertinya tidak terjadi apa-apa".
      router.push(`/admin/${definisi.slug}/${hasil.id}?tersimpan=baru`)
      return
    }

    setPesan({ jenis: 'sukses', teks: 'Perubahan tersimpan.' })
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
    // Tanpa pesan ini, satu-satunya tanda bahwa aksinya berhasil adalah lencana
    // kecil yang berubah di sudut — mudah terlewat, dan orang menekan tombolnya
    // dua kali karena tidak yakin.
    setPesan({ jenis: 'sukses', teks: 'Entri diterbitkan — sudah tampil di halaman publik.' })
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
    setPesan({
      jenis: 'sukses',
      teks: 'Entri dijadikan draft — sudah tidak tampil di halaman publik.',
    })
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
      {/* D21 — koleksi singleton (`site_settings`, `hero`, `about`, ...) tidak
          punya kolom `status`/`sort_order` sama sekali (satu-satunya barisnya
          selalu ada, tidak pernah draft/terbit/dihapus terpisah) — badge dan
          tombol terbitkan/jadikan-draft/hapus di bawah ini konsep yang murni
          milik koleksi biasa, jadi disembunyikan sepenuhnya untuk singleton. */}
      {!definisi.singleton && entri && (
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
                onClick={() =>
                  setKonfirmasi({
                    judul: 'Terbitkan entri ini?',
                    keterangan:
                      'Setelah diterbitkan, entri ini langsung tampil di halaman publik dan bisa dilihat siapa saja.',
                    labelAksi: 'Terbitkan',
                    jenis: 'biasa',
                    jalankan: tanganiTerbitkan,
                  })
                }
                disabled={sedangProses}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-surface disabled:opacity-50"
              >
                Terbitkan
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setKonfirmasi({
                    judul: 'Jadikan draft?',
                    keterangan:
                      'Entri ini akan hilang dari halaman publik. Isinya tetap tersimpan dan bisa diterbitkan lagi kapan pun.',
                    labelAksi: 'Jadikan Draft',
                    jenis: 'biasa',
                    jalankan: tanganiJadikanDraft,
                  })
                }
                disabled={sedangProses}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-soft disabled:opacity-50"
              >
                Jadikan Draft
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                setKonfirmasi({
                  judul: 'Hapus entri ini?',
                  keterangan:
                    'Entri dan seluruh isinya dihapus permanen. Tindakan ini TIDAK bisa dibatalkan.',
                  labelAksi: 'Hapus Permanen',
                  jenis: 'bahaya',
                  jalankan: tanganiHapus,
                })
              }
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

      {konfirmasi && (
        <DialogKonfirmasi
          judul={konfirmasi.judul}
          keterangan={konfirmasi.keterangan}
          labelAksi={konfirmasi.labelAksi}
          jenis={konfirmasi.jenis}
          sedangProses={sedangProses}
          onBatal={() => setKonfirmasi(null)}
          onKonfirmasi={async () => {
            // Dialog ditutup DULU, lalu aksinya dijalankan. Kalau urutannya
            // dibalik, dialog menggantung selama permintaan berjalan dan
            // pengguna bisa menekan tombolnya lagi.
            const jalankan = konfirmasi.jalankan
            setKonfirmasi(null)
            await jalankan()
          }}
        />
      )}
    </div>
  )
}
