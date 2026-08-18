import Link from 'next/link'
import { hitungEntri } from '@/lib/admin/entri'
import { registryKoleksi } from '@/lib/admin/skema'

/**
 * Daftar koleksi, dibaca dari registry (Task 3) — bukan daftar keras.
 * Menambah koleksi baru di Fase 2b tidak menyentuh berkas ini: cukup
 * menambah satu berkas skema, dan baris barunya muncul otomatis di sini.
 *
 * Email pengguna + tombol keluar sudah pindah ke kerangka bersama
 * `(terlindungi)/layout.tsx` di task ini, jadi halaman ini murni daftar.
 */
export default async function HalamanAdmin() {
  const koleksi = await Promise.all(
    Object.values(registryKoleksi).map(async (definisi) => ({
      definisi,
      cacah: await hitungEntri(definisi.tabel),
    })),
  )

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">Koleksi</h1>

      <ul className="grid gap-4 sm:grid-cols-2">
        {koleksi.map(({ definisi, cacah }) => (
          <li key={definisi.slug}>
            <Link
              href={`/admin/${definisi.slug}`}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 text-sm hover:border-primary"
            >
              <span className="font-medium text-ink">{definisi.label}</span>
              <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-semibold text-primary">
                {cacah} entri
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
