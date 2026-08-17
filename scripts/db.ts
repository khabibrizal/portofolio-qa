/**
 * Runner database: push migrasi, muat seed, reset ke keadaan awal.
 *
 * Dijalankan HANYA dari mesin dev, tidak pernah di CI — CI membaca database
 * yang sudah bermigrasi. Ini satu-satunya berkas yang memegang SUPABASE_DB_URL;
 * aplikasi Next.js tidak pernah menyentuh koneksi Postgres langsung, ia hanya
 * bicara REST lewat publishable key sehingga RLS selalu berlaku padanya.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'

/** Urutan sengaja terbalik dari urutan pembuatan agar TRUNCATE aman. */
const TABEL = [
  'analytics_events',
  'testimonials',
  'education',
  'certifications',
  'experiences',
  'lab_scenarios',
  'case_studies',
  'skill_categories',
  'tools',
  'about',
  'hero',
  'site_settings',
] as const

const PERINTAH = ['push', 'seed', 'reset'] as const
type Perintah = (typeof PERINTAH)[number]

/**
 * Memuat `.env.local` sendiri, bukan lewat flag `--env-file` Node.
 * Alasannya: flag itu berbeda ketersediaannya antar versi Node dan gagal keras
 * kalau berkasnya tidak ada, sedangkan skrip ini juga harus bisa dijalankan
 * dengan variabel yang sudah tersedia di environment.
 */
function muatEnvLokal(): void {
  if (process.env.SUPABASE_DB_URL) return

  const berkas = resolve(process.cwd(), '.env.local')
  if (!existsSync(berkas)) return

  for (const baris of readFileSync(berkas, 'utf8').split('\n')) {
    const cocok = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!cocok) continue

    const [, nama, nilaiMentah] = cocok
    if (process.env[nama]) continue

    process.env[nama] = nilaiMentah.replace(/^["']|["']$/g, '')
  }
}

/**
 * Menyusun connection string.
 *
 * Bentuk yang disarankan adalah tiga bagian terpisah (HOST/USER/PASSWORD), bukan
 * satu URL utuh: password database kerap memuat karakter yang harus
 * percent-encoded (`@`, `#`, `/`, `?`), dan menyerahkan itu ke manusia adalah
 * sumber kegagalan yang menyamar sebagai "password salah". Di sini skrip yang
 * meng-encode-nya.
 *
 * SUPABASE_DB_URL tetap didukung dan menang bila diisi, untuk kasus di mana
 * string utuh datang dari luar (mis. secret CI).
 */
function connectionString(): string {
  const utuh = process.env.SUPABASE_DB_URL
  if (utuh) return utuh

  const host = process.env.SUPABASE_DB_HOST
  const user = process.env.SUPABASE_DB_USER
  const password = process.env.SUPABASE_DB_PASSWORD

  if (!host || !user || !password) {
    throw new Error(
      'Koneksi database belum lengkap di .env.local.\n' +
        'Isi ketiganya (password ditempel apa adanya, TANPA encoding manual):\n' +
        '  SUPABASE_DB_HOST=aws-0-<region>.pooler.supabase.com\n' +
        '  SUPABASE_DB_USER=postgres.<project-ref>\n' +
        '  SUPABASE_DB_PASSWORD=...\n' +
        'Ambil dari Supabase Dashboard → Connect. Pakai host pooler port 5432, ' +
        'bukan direct connection (IPv6-only) dan bukan port 6543 (transaction mode).',
    )
  }

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:5432/postgres?sslmode=no-verify`
}

function bacaSeed(): string {
  const berkas = resolve(process.cwd(), 'supabase/seed.sql')
  if (!existsSync(berkas)) {
    throw new Error('supabase/seed.sql belum ada — dibuat pada Task 7 rencana Fase 1a.')
  }
  return readFileSync(berkas, 'utf8')
}

/** Mendorong migrasi lewat Supabase CLI. Tidak butuh Docker maupun login. */
function push(): void {
  const hasil = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['--yes', 'supabase@latest', 'db', 'push', '--db-url', connectionString()],
    { stdio: 'inherit' },
  )

  if (hasil.status !== 0) {
    throw new Error(`supabase db push gagal dengan exit code ${hasil.status}`)
  }
}

async function seed({ kosongkanDulu }: { kosongkanDulu: boolean }): Promise<void> {
  const sql = bacaSeed()
  const client = new Client({ connectionString: connectionString() })
  await client.connect()

  try {
    if (kosongkanDulu) {
      const daftar = TABEL.map((t) => `public.${t}`).join(', ')
      await client.query(`truncate table ${daftar} cascade`)
      console.log(`Dikosongkan: ${TABEL.length} tabel`)
    }

    await client.query(sql)
    console.log('Seed dimuat')
  } finally {
    await client.end()
  }
}

async function jalankan(perintah: Perintah): Promise<void> {
  muatEnvLokal()

  switch (perintah) {
    case 'push':
      return push()
    case 'seed':
      return seed({ kosongkanDulu: false })
    case 'reset':
      return seed({ kosongkanDulu: true })
  }
}

const argumen = process.argv[2]
if (!PERINTAH.includes(argumen as Perintah)) {
  console.error(`Pemakaian: tsx scripts/db.ts <${PERINTAH.join('|')}>`)
  process.exit(1)
}

jalankan(argumen as Perintah).catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
