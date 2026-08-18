import { redirect } from 'next/navigation'
import { keluar } from '@/lib/admin/aksi'
import { createClient } from '@/lib/supabase/server'

// Placeholder sederhana untuk Task 2 — daftar koleksi sungguhan dibangun di
// Task 5. Halaman ini hanya membuktikan sesi login: email pengguna tampil,
// dan tombol keluar mengembalikan ke /admin/login.
export default async function HalamanAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // proxy.ts sudah menjaga rute ini, tapi Server Component tidak boleh
  // mengandalkan itu semata (defense-in-depth) — verifikasi ulang di sini.
  if (!user) redirect('/admin/login')

  return (
    <main className="flex min-h-screen flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">Admin</h1>
      <p>
        Masuk sebagai <strong>{user.email}</strong>
      </p>
      <form action={keluar}>
        <button type="submit">Keluar</button>
      </form>
    </main>
  )
}
