import Link from 'next/link'
import { redirect } from 'next/navigation'
import { keluar } from '@/lib/admin/aksi'
import { registryKoleksi } from '@/lib/admin/skema'
import { createClient } from '@/lib/supabase/server'

/**
 * Kerangka bersama seluruh halaman admin yang butuh sesi (di luar `/admin/login`,
 * yang tinggal di luar grup rute ini justru supaya TIDAK ikut memakai kerangka
 * ini — halaman login tidak butuh navigasi koleksi maupun tombol keluar).
 *
 * Navigasi dibaca dari `registryKoleksi`, bukan daftar keras: menambah
 * koleksi di Fase 2b harus cukup dengan menambah satu berkas skema, tanpa
 * menyentuh berkas ini.
 */
export default async function LayoutTerlindungi({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // proxy.ts sudah menjaga seluruh /admin/*, tapi Server Component tidak
  // boleh mengandalkan itu semata (defense-in-depth) — verifikasi ulang di sini.
  if (!user) redirect('/admin/login')

  const koleksi = Object.values(registryKoleksi)

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-surface p-6">
        <Link href="/admin" className="font-display text-lg font-semibold text-ink">
          Admin
        </Link>

        <nav className="flex flex-col gap-1">
          {koleksi.map((definisi) => (
            <Link
              key={definisi.slug}
              href={`/admin/${definisi.slug}`}
              className="rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-primary-tint hover:text-primary"
            >
              {definisi.label}
            </Link>
          ))}
        </nav>

        {/* Pratinjau (Task 7) — rute terpisah `/admin/pratinjau/[locale]`,
            BUKAN cookie di landing (D14). Tertaut untuk kedua locale karena
            keduanya bisa punya draft berbeda (mis. category_name terisi di
            id tapi belum di en). */}
        <nav className="flex flex-col gap-1 border-t border-border pt-4">
          <span className="px-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Pratinjau
          </span>
          <Link
            href="/admin/pratinjau/id"
            className="rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-primary-tint hover:text-primary"
          >
            Pratinjau (ID)
          </Link>
          <Link
            href="/admin/pratinjau/en"
            className="rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-primary-tint hover:text-primary"
          >
            Pratinjau (EN)
          </Link>
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <span className="text-ink-soft">
            Masuk sebagai <strong className="text-ink">{user.email}</strong>
          </span>
          <form action={keluar}>
            <button type="submit" className="text-left text-sm text-ink-soft underline hover:text-ink">
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
