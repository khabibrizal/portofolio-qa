import { NextResponse, type NextRequest } from 'next/server'
import { perbaruiSesi } from '@/lib/supabase/middleware'

// PENYIMPANGAN dari rencana: Next.js 16 mendeprekasi konvensi file
// `middleware.ts` (+ ekspor `middleware`) dan menggantinya dengan `proxy.ts`
// (+ ekspor `proxy`) — lihat node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/proxy.md. Logikanya identik dengan yang tertulis di
// rencana, hanya nama file & fungsi yang menyesuaikan API terpasang.

// PENYIMPANGAN KEDUA: rute pendaftaran publik TIDAK PERNAH ada (spec §7).
// Tanpa daftar ini, proxy mengalihkan SEMUA permintaan tak beroterisasi di
// bawah /admin/:path* ke /admin/login — termasuk path yang sama sekali
// tidak punya halaman — sehingga path itu tampak "ada" (respons 200 di
// halaman login) alih-alih benar-benar 404. Daftar ini membiarkan Next.js
// menyatakan 404 apa adanya untuk path yang memang tidak pernah dibuatkan
// halaman, sebelum logika pengalihan login sempat menyentuhnya.
const RUTE_PENDAFTARAN_TIDAK_PERNAH_ADA = ['/admin/daftar', '/admin/signup', '/admin/register']

export async function proxy(request: NextRequest) {
  const jalur = request.nextUrl.pathname

  if (RUTE_PENDAFTARAN_TIDAK_PERNAH_ADA.includes(jalur)) {
    return NextResponse.next()
  }

  const { response, user } = await perbaruiSesi(request)

  const halamanLogin = jalur === '/admin/login'

  if (!user && !halamanLogin) {
    const tujuan = request.nextUrl.clone()
    tujuan.pathname = '/admin/login'
    return NextResponse.redirect(tujuan)
  }

  if (user && halamanLogin) {
    const tujuan = request.nextUrl.clone()
    tujuan.pathname = '/admin'
    return NextResponse.redirect(tujuan)
  }

  return response
}

// Hanya rute admin yang dijaga. Landing sengaja TIDAK masuk matcher:
// menyentuhnya dengan proxy yang membaca cookie akan membuatnya dinamis
// dan mematikan ISR — pelajaran dari Fase 1b.
export const config = {
  matcher: ['/admin/:path*'],
}
