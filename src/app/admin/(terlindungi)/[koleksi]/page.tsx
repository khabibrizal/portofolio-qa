import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TombolUrutkan } from '@/components/admin/TombolUrutkan'
import { ambilEntri, judulEntri } from '@/lib/admin/entri'
import { registryKoleksi } from '@/lib/admin/skema'

/**
 * Daftar entri satu koleksi.
 *
 * `koleksi` di params berasal dari alamat yang diketik orang, bukan
 * pemanggilan internal — jadi keanggotaan registry diperiksa LANGSUNG lewat
 * `registryKoleksi[koleksi]` (bukan `cariDefinisiKoleksi()`, yang sengaja
 * melempar untuk slug tak dikenal karena di situ slug adalah kontrak
 * internal). Slug tak terdaftar di sini selalu berarti 404, bukan 500.
 */
export default async function HalamanDaftarEntri({
  params,
}: {
  params: Promise<{ koleksi: string }>
}) {
  const { koleksi } = await params

  const definisi = registryKoleksi[koleksi]
  if (!definisi) notFound()

  const entri = await ambilEntri(definisi.tabel)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{definisi.label}</h1>
        <Link
          href={`/admin/${definisi.slug}/baru`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-surface"
        >
          Tambah {definisi.labelTunggal}
        </Link>
      </div>

      {entri.length === 0 ? (
        <p className="text-sm text-ink-faint">Belum ada entri.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entri.map((baris, i) => (
            <li
              key={baris.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <TombolUrutkan
                  koleksi={definisi.slug}
                  id={baris.id}
                  bisaNaik={i > 0}
                  bisaTurun={i < entri.length - 1}
                />
                <span className="w-8 text-sm text-ink-faint">#{baris.sort_order}</span>
                <span className="font-medium text-ink">{judulEntri(definisi, baris)}</span>
                {baris.status === 'draft' ? (
                  <span className="rounded-full border border-major px-2.5 py-1 font-mono text-[11px] font-semibold text-major">
                    Draft
                  </span>
                ) : (
                  <span className="rounded-full bg-pass-bg px-2.5 py-1 font-mono text-[11px] font-semibold text-pass">
                    Terbit
                  </span>
                )}
              </div>
              <Link
                href={`/admin/${definisi.slug}/${baris.id}`}
                className="text-sm font-medium text-primary underline"
              >
                Ubah
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
