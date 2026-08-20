'use client'

import { useEffect, useRef } from 'react'

/**
 * Dialog konfirmasi untuk aksi yang punya akibat.
 *
 * BUKAN `window.confirm`. Dialog bawaan peramban tidak bisa diberi gaya, teksnya
 * tidak bisa menjelaskan akibat secara spesifik, dan di beberapa peramban ia
 * bisa ditekan otomatis oleh pengaturan pengguna — pengaman yang bisa hilang
 * tanpa jejak bukan pengaman.
 *
 * Yang dijaga di sini, dan alasannya:
 *
 * - `role="dialog"` + `aria-modal` + `aria-labelledby`/`aria-describedby`
 *   supaya pembaca layar mengumumkan judul DAN akibatnya, bukan hanya tombolnya.
 * - Fokus dipindahkan ke tombol BATAL saat dibuka, bukan ke tombol aksinya.
 *   Menaruh fokus di tombol merah berarti satu ketukan Enter yang tak sengaja
 *   menyelesaikan aksi yang justru sedang dikonfirmasi.
 * - Escape membatalkan; klik latar membatalkan. Keduanya jalan keluar yang
 *   dicari orang secara refleks.
 * - Tab dikurung di dalam dialog. Tanpa itu fokus bisa berpindah ke tombol di
 *   belakangnya yang masih bisa diklik, dan pengguna menekan sesuatu yang
 *   sedang tertutup lapisan gelap.
 */
export type JenisKonfirmasi = 'biasa' | 'bahaya'

export function DialogKonfirmasi({
  judul,
  keterangan,
  labelAksi,
  jenis = 'biasa',
  sedangProses = false,
  onKonfirmasi,
  onBatal,
}: {
  judul: string
  keterangan: string
  labelAksi: string
  jenis?: JenisKonfirmasi
  sedangProses?: boolean
  onKonfirmasi: () => void
  onBatal: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const batalRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    batalRef.current?.focus()
  }, [])

  useEffect(() => {
    function padaTombol(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onBatal()
        return
      }

      if (e.key !== 'Tab') return

      // Kurung fokus: dari elemen terakhir kembali ke pertama, dan sebaliknya.
      const bisaFokus = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])')
      if (!bisaFokus || bisaFokus.length === 0) return

      const pertama = bisaFokus[0]
      const terakhir = bisaFokus[bisaFokus.length - 1]

      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault()
        terakhir.focus()
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault()
        pertama.focus()
      }
    }

    document.addEventListener('keydown', padaTombol)
    return () => document.removeEventListener('keydown', padaTombol)
  }, [onBatal])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      // Klik pada LATAR membatalkan; klik di dalam panel tidak menembus ke sini.
      onClick={onBatal}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="konfirmasi-judul"
        aria-describedby="konfirmasi-keterangan"
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="konfirmasi-judul" className="mb-2 text-[17px] font-semibold text-ink">
          {judul}
        </h2>
        <p id="konfirmasi-keterangan" className="mb-6 text-sm text-ink-soft">
          {keterangan}
        </p>

        <div className="flex justify-end gap-2">
          <button
            ref={batalRef}
            type="button"
            onClick={onBatal}
            disabled={sedangProses}
            className="rounded-md border border-border px-4 py-2 text-sm text-ink-soft disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onKonfirmasi}
            disabled={sedangProses}
            className={
              jenis === 'bahaya'
                ? 'rounded-md bg-critical px-4 py-2 text-sm font-medium text-surface disabled:opacity-50'
                : 'rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface disabled:opacity-50'
            }
          >
            {sedangProses ? 'Memproses…' : labelAksi}
          </button>
        </div>
      </div>
    </div>
  )
}
