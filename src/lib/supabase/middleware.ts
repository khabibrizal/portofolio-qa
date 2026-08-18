import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

/**
 * Menyegarkan sesi Supabase pada setiap permintaan ke rute admin.
 *
 * Tanpa ini, token kedaluwarsa di tengah pemakaian dan pengguna terlempar
 * ke login saat sedang mengisi form — kehilangan yang belum tersimpan.
 */
export async function perbaruiSesi(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // getUser() memverifikasi token ke server Supabase. getSession() hanya
  // membaca cookie dan bisa dipalsukan — jangan dipakai untuk otorisasi.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
