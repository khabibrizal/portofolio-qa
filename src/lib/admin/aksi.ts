'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const skemaMasuk = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export type HasilMasuk = { error: string } | undefined

// Satu pesan yang sama untuk email tak dikenal maupun password salah —
// membedakan keduanya membocorkan apakah sebuah email terdaftar di sistem.
const PESAN_GAGAL = 'Email atau kata sandi salah.'

/**
 * Server Action login. Dipakai lewat `useActionState` di form login supaya
 * pesan error bisa ditampilkan tanpa reload dan tanpa halaman error generik.
 */
export async function masuk(_state: HasilMasuk, formData: FormData): Promise<HasilMasuk> {
  const hasil = skemaMasuk.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!hasil.success) {
    return { error: PESAN_GAGAL }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(hasil.data)

  if (error) {
    return { error: PESAN_GAGAL }
  }

  redirect('/admin')
}

/** Server Action logout, dipanggil langsung dari `<form action={keluar}>`. */
export async function keluar() {
  const supabase = await createClient()
  // scope: 'local' — HANYA mencabut sesi di browser ini. Default signOut()
  // Supabase adalah scope 'global', yang mencabut refresh token pengguna di
  // SEMUA sesi/perangkat sekaligus. Itu ketidaksesuaian dengan tombol
  // "Keluar" satu perangkat, dan di test E2E lokal (banyak worker paralel,
  // satu akun admin nyata dipakai bersama) itu konkret: logout di satu test
  // mencabut sesi test lain yang masih berjalan, membuatnya dialihkan balik
  // ke /admin/login secara acak — ditemukan saat menambah admin-daftar.spec.ts
  // (Task 5) yang untuk pertama kalinya menjalankan >1 sesi nyata sekaligus.
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/admin/login')
}
