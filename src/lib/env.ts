import { z } from 'zod'

const skema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).startsWith('sb_publishable_'),
})

export type Env = z.infer<typeof skema>

/** Divalidasi eksplisit lewat parameter agar bisa diuji tanpa menyentuh process.env global. */
export function parseEnv(sumber: Record<string, string | undefined>): Env {
  const hasil = skema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: sumber.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: sumber.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })

  if (!hasil.success) {
    const rincian = hasil.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Environment variable tidak valid — ${rincian}`)
  }

  return hasil.data
}

// Setiap variabel dibaca sebagai akses literal `process.env.NAMA`, bukan dengan
// mengoper `process.env` utuh. Next.js hanya menyulih nilai NEXT_PUBLIC_* ke dalam
// bundel ketika melihat bentuk literal itu; mengoper objeknya membuat nilainya
// undefined begitu modul ini tersentuh dari sisi klien.
export const env = parseEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
})
