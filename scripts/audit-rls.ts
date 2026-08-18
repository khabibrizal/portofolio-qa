/**
 * Audit kebijakan RLS pada tingkat database.
 *
 * Suite Playwright di `tests/rls/` menguji lewat REST sebagai klien ANONIM.
 * Yang tidak bisa diuji dari sana adalah pertanyaan yang justru paling penting:
 * "bagaimana kalau penyerang mendaftar dulu, lalu menulis sebagai pengguna
 * terautentikasi biasa?" Membuat akun kedua sungguhan mustahil karena
 * pendaftaran publik sudah ditutup — dan menutupnya memang benar.
 *
 * Jadi peran dan klaim JWT-nya disimulasikan langsung di Postgres. Ini bukan
 * jalan pintas: inilah cara paling presisi menguji kebijakan RLS, karena ia
 * memeriksa kebijakannya sendiri, bukan perilaku satu klien tertentu.
 *
 * DUA HAL YANG MEMBUAT AUDIT INI BERARTI — versi pertamanya tidak punya
 * keduanya, dan akibatnya ia melaporkan 27/27 lulus bahkan setelah satu
 * kebijakan sengaja dilonggarkan:
 *
 * 1. Payload tiap percobaan harus SAH. Versi pertama memakai
 *    `insert into tools (sort_order) values (999)`, yang gagal karena kolom
 *    `name` wajib — bukan karena RLS. Percobaan yang tidak akan berhasil
 *    walaupun diizinkan tidak membuktikan apa pun tentang izinnya.
 *
 * 2. Penolakannya harus dipastikan DATANG DARI RLS. Postgres menolak dengan
 *    kode berbeda untuk sebab berbeda; hanya `42501` yang berarti kebijakan
 *    baris yang menahan. Menerima sembarang kegagalan sebagai "aman" adalah
 *    cara paling mudah membuat audit keamanan yang selalu hijau.
 *
 * Seluruh percobaan berjalan di dalam transaksi yang di-rollback, sehingga
 * audit ini tidak pernah meninggalkan jejak.
 */
import { readFileSync } from 'node:fs'
import { Client } from 'pg'

/** UUID yang tidak pernah ada di tabel pemilik. */
const UID_BUKAN_PEMILIK = '00000000-0000-4000-8000-000000000001'

/** Kode SQLSTATE untuk penolakan oleh row level security. */
const KODE_DITOLAK_RLS = '42501'

const L = (t: string) => `'{"id":"${t}","en":"${t}"}'::jsonb`

/** Payload SAH per tabel — akan berhasil bila (dan hanya bila) RLS mengizinkan. */
const SISIP: Record<string, string> = {
  tools: `insert into public.tools (name) values ('Audit RLS')`,
  skill_categories: `insert into public.skill_categories (category_name) values (${L('Audit')})`,
  case_studies: `insert into public.case_studies (test_code, project_name, role, objective)
                 values ('TC-AUDIT', ${L('Audit')}, ${L('Audit')}, ${L('Audit')})`,
  lab_scenarios: `insert into public.lab_scenarios (framework_name, scenario_title, scenario_description)
                  values ('Audit', ${L('Audit')}, ${L('Audit')})`,
  experiences: `insert into public.experiences (company, role, period_start)
                values (${L('Audit')}, ${L('Audit')}, '2020-01-01')`,
  certifications: `insert into public.certifications (name, issuer, year)
                   values ('Audit', 'Audit', 2020)`,
  education: `insert into public.education (institution, degree, year)
              values ('Audit', ${L('Audit')}, 2020)`,
  testimonials: `insert into public.testimonials (quote, author_name, author_role)
                 values (${L('Audit')}, 'Audit', ${L('Audit')})`,
}

/** Singleton tidak bisa disisipi (dikunci id = 1), jadi yang diuji UPDATE. */
const SINGLETON = ['site_settings', 'hero', 'about']

type Hasil = { nama: string; lulus: boolean; catatan: string }
const hasil: Hasil[] = []

function catat(nama: string, lulus: boolean, catatan = '') {
  hasil.push({ nama, lulus, catatan })
}

function muatEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync('.env.local', 'utf8')
      .split('\n')
      .map((b) => b.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1], m[2].trim()]),
  )
}

type Jawaban = { berhasil: boolean; kode: string; pesan: string; baris: number }

async function sebagai(
  client: Client,
  peran: 'anon' | 'authenticated',
  uid: string | null,
  sql: string,
): Promise<Jawaban> {
  await client.query('begin')
  try {
    const klaim = JSON.stringify(uid ? { sub: uid, role: peran } : { role: peran })
    await client.query(`set local role ${peran}`)
    await client.query(`select set_config('request.jwt.claims', $1, true)`, [klaim])

    const r = await client.query(sql)
    return { berhasil: true, kode: '', pesan: '', baris: r.rowCount ?? 0 }
  } catch (e) {
    const err = e as { code?: string; message?: string }
    return { berhasil: false, kode: err.code ?? '', pesan: err.message ?? String(e), baris: 0 }
  } finally {
    await client.query('rollback')
  }
}

/** Lulus HANYA bila ditolak, dan ditolak oleh RLS — bukan oleh sebab lain. */
function harusDitolakRls(nama: string, j: Jawaban) {
  if (j.berhasil) return catat(nama, false, 'DITERIMA — kebijakan bocor')
  if (j.kode !== KODE_DITOLAK_RLS) {
    return catat(nama, false, `ditolak tapi bukan oleh RLS (kode ${j.kode}): ${j.pesan.slice(0, 90)}`)
  }
  catat(nama, true)
}

async function main() {
  const env = muatEnv()
  const client = new Client({
    connectionString: `postgresql://${env.SUPABASE_DB_USER}:${encodeURIComponent(
      env.SUPABASE_DB_PASSWORD,
    )}@${env.SUPABASE_DB_HOST}:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  })
  await client.connect()

  try {
    const { rows } = await client.query('select uid from public.pemilik limit 1')
    if (rows.length === 0) throw new Error('Tabel pemilik kosong — migrasi belum diterapkan?')
    const pemilik = rows[0].uid as string

    // --- Terautentikasi tapi BUKAN pemilik ---
    for (const [tabel, sql] of Object.entries(SISIP)) {
      harusDitolakRls(
        `${tabel}: INSERT sah oleh bukan-pemilik ditolak RLS`,
        await sebagai(client, 'authenticated', UID_BUKAN_PEMILIK, sql),
      )

      const hapus = await sebagai(
        client, 'authenticated', UID_BUKAN_PEMILIK, `delete from public.${tabel}`,
      )
      catat(
        `${tabel}: DELETE oleh bukan-pemilik tidak mengenai baris`,
        hapus.baris === 0,
        hapus.baris > 0 ? `${hapus.baris} baris terhapus — kebijakan bocor` : '',
      )
    }

    for (const tabel of SINGLETON) {
      const ubah = await sebagai(
        client, 'authenticated', UID_BUKAN_PEMILIK,
        `update public.${tabel} set updated_at = now() where id = 1`,
      )
      catat(
        `${tabel}: UPDATE oleh bukan-pemilik tidak mengenai baris`,
        ubah.baris === 0,
        ubah.baris > 0 ? `${ubah.baris} baris berubah — kebijakan bocor` : '',
      )
    }

    const draft = await sebagai(
      client, 'authenticated', UID_BUKAN_PEMILIK,
      `select id from public.case_studies where status = 'draft'`,
    )
    catat('draft tidak terbaca oleh bukan-pemilik', draft.baris === 0,
      draft.baris > 0 ? `${draft.baris} baris draft terbaca — bocor` : '')

    const analytics = await sebagai(
      client, 'authenticated', UID_BUKAN_PEMILIK, 'select id from public.analytics_events',
    )
    catat('analytics tertutup untuk bukan-pemilik', analytics.baris === 0,
      analytics.baris > 0 ? `${analytics.baris} baris terbaca — bocor` : '')

    // --- Pemilik HARUS bisa bekerja; kalau tidak, admin tak akan berfungsi ---
    const pemilikTulis = await sebagai(client, 'authenticated', pemilik, SISIP.tools)
    catat('pemilik bisa menulis', pemilikTulis.berhasil, pemilikTulis.pesan.slice(0, 90))

    const pemilikDraft = await sebagai(
      client, 'authenticated', pemilik,
      `select id from public.case_studies where status = 'draft'`,
    )
    catat('pemilik bisa membaca draft', pemilikDraft.baris > 0,
      pemilikDraft.baris === 0 ? 'tidak ada draft terbaca' : '')

    // --- Anon tetap bisa membaca yang terbit, dan tetap tidak bisa menulis ---
    const anonBaca = await sebagai(
      client, 'anon', null, `select id from public.case_studies where status = 'published'`,
    )
    catat('anon tetap bisa membaca yang terbit', anonBaca.baris > 0, anonBaca.pesan.slice(0, 90))

    harusDitolakRls(
      'anon: INSERT sah ditolak RLS',
      await sebagai(client, 'anon', null, SISIP.tools),
    )
  } finally {
    await client.end()
  }

  const gagal = hasil.filter((h) => !h.lulus)
  for (const h of gagal) console.log(`GAGAL  ${h.nama}${h.catatan ? ` — ${h.catatan}` : ''}`)
  console.log(`\n${hasil.length - gagal.length}/${hasil.length} pemeriksaan lulus`)

  if (gagal.length > 0) process.exit(1)
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
