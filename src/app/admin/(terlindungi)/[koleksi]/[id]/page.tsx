import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormEntriKoleksi } from '@/components/admin/FormEntriKoleksi'
import type { BarisEntri } from '@/lib/admin/entri'
import { registryKoleksi } from '@/lib/admin/skema'
import { createClient } from '@/lib/supabase/server'

/**
 * Form satu entri — `id === 'baru'` untuk entri baru, id sungguhan untuk edit.
 *
 * Sama seperti `[koleksi]/page.tsx`: `koleksi` di params berasal dari alamat
 * yang diketik orang, jadi keanggotaan registry diperiksa LANGSUNG lewat
 * `registryKoleksi[koleksi]` (bukan `cariDefinisiKoleksi()`, yang sengaja
 * melempar untuk slug tak dikenal) — slug tak terdaftar di sini juga selalu
 * berarti 404, bukan 500.
 */
export default async function HalamanFormEntri({
  params,
}: {
  params: Promise<{ koleksi: string; id: string }>
}) {
  const { koleksi, id } = await params

  const definisi = registryKoleksi[koleksi]
  if (!definisi) notFound()

  // D21 — koleksi singleton tidak pernah punya rute "entri baru": baris
  // satu-satunya sudah selalu ada (dibuat lewat migrasi/seed, bukan lewat
  // form ini), jadi `/admin/<slug>/baru` untuk koleksi singleton bukan
  // keadaan yang sah. 404, bukan diteruskan ke `simpan()` yang akan mencoba
  // INSERT dengan `sort_order` — kolom yang sama sekali tidak ada di tabel
  // singleton — dan gagal dengan error database yang membingungkan.
  if (definisi.singleton && id === 'baru') notFound()

  let entri: BarisEntri | null = null

  if (id !== 'baru') {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from(definisi.tabel)
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      // '22P02' — invalid input syntax for type uuid: id di URL bukan UUID
      // sama sekali (typo, atau orang mengetik bebas). Itu tetap berarti
      // "entri ini tidak ada", bukan kegagalan server — 404, bukan 500.
      if (error.code === '22P02') notFound()
      throw new Error(`Gagal memuat entri ${definisi.tabel}: ${error.message}`)
    }
    // id berbentuk UUID valid tapi tak ada barisnya — juga 404.
    if (!data) notFound()
    entri = data as BarisEntri
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          {definisi.singleton
            ? definisi.label
            : id === 'baru'
              ? `Tambah ${definisi.labelTunggal}`
              : `Ubah ${definisi.labelTunggal}`}
        </h1>
        {/* D21 — koleksi singleton tidak punya daftar untuk dikembalikan;
            "Kembali ke daftar" cuma masuk akal untuk koleksi biasa. */}
        {!definisi.singleton && (
          <Link href={`/admin/${definisi.slug}`} className="text-sm text-ink-soft underline">
            Kembali ke daftar
          </Link>
        )}
      </div>

      <FormEntriKoleksi definisi={definisi} id={id} entri={entri} />
    </div>
  )
}
