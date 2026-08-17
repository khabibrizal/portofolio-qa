# Fase 1a — Skema Database, RLS, dan Seed

> **Untuk pekerja agentik:** eksekusi task demi task, berurutan. Langkah memakai checkbox (`- [ ]`) untuk pelacakan.

**Goal:** Database Supabase berisi 12 tabel sesuai spec, dengan Row Level Security yang **terbukti** menolak pembaca anonim membaca draft dan menolak semua tulisan anonim, plus data seed dwibahasa yang membuat Fase 1b punya sesuatu untuk dirender.

**Architecture:** Migrasi sebagai file SQL bernomor di `supabase/migrations/`, diterapkan ke proyek Supabase cloud lewat `supabase db push --db-url` — tanpa Docker, tanpa `supabase login`, tanpa `supabase link` (sudah dibuktikan). Seed dan reset dijalankan skrip Node berbasis `pg`, sehingga tidak ada binary eksternal yang dibutuhkan. Kebenaran RLS diverifikasi test Playwright yang menembak REST API Supabase sebagai klien anonim sungguhan, bukan diasumsikan dari isi kebijakan.

**Tech Stack:** Supabase Postgres 17, Supabase CLI 2.114 (`--db-url`), `pg` 8.23, Playwright 1.62, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-17-portofolio-qa-design.md` §5, §7
**Fase sebelumnya:** `2026-08-17-fase-0-fondasi.md` (selesai)

---

## Prasyarat — WAJIB lunas sebelum Task 1

- [ ] **U-1 dilunasi** (`UTANG-TERBUKA.md`): proyek `portofolio-prod` dibuat, variabel `production` di Vercel dipindah ke sana. Tanpa ini, tabel yang dibuat di Fase 1a akan langsung disajikan produksi dari database dev.
- [ ] **Connection string tersedia.** Dari dashboard Supabase `portofolio-dev` → **Connect** → **Session pooler**.

  Ambil yang **Session pooler**, bukan "Direct connection" maupun "Transaction pooler". Alasannya konkret: koneksi langsung Supabase kini IPv6-only dan akan gagal di jaringan IPv4; transaction pooler (port 6543) tidak mendukung sebagian perintah DDL yang dibutuhkan migrasi. Session pooler mendukung keduanya.

  Bentuknya: `postgresql://postgres.<ref>:<PASSWORD>@aws-<n>-<region>.pooler.supabase.com:5432/postgres`

  Password harus **percent-encoded** kalau memuat karakter khusus (`@` → `%40`, `#` → `%23`, dst) — `supabase db push` mensyaratkannya.

---

## Ruang lingkup

**Termasuk:** infrastruktur migrasi, 12 tabel, tipe enum, trigger `updated_at`, validasi bentuk teks dwibahasa di level DB, kebijakan RLS, data seed dwibahasa, skrip `db:push`/`db:seed`/`db:reset`, test RLS, integrasi ke CI.

**Tidak termasuk (Fase 1b):** komponen React, i18n routing, query konten, rendering.
**Tidak termasuk (Fase 2):** auth admin, form engine, CRUD.
**Tidak termasuk (Fase 3):** penulisan `analytics_events` (butuh secret key sisi server).

## Definition of done

1. `npm run db:push` menerapkan seluruh migrasi ke `portofolio-dev` tanpa error
2. `npm run db:reset` mengembalikan database ke keadaan seed yang identik, berapa kali pun dijalankan
3. `npm run test:e2e` hijau, termasuk suite RLS baru
4. Klien anonim **terbukti** tidak bisa: membaca baris `draft`, menulis ke tabel mana pun, membaca `analytics_events`
5. CI hijau dengan suite RLS ikut berjalan

---

## Struktur file yang dihasilkan

```
supabase/
  config.toml                          # minimal, hanya untuk CLI
  migrations/
    20260818000001_fondasi.sql         # extension, enum, fungsi, trigger
    20260818000002_singleton.sql       # site_settings, hero, about
    20260818000003_koleksi.sql         # 8 tabel koleksi
    20260818000004_analytics.sql       # analytics_events
    20260818000005_rls.sql             # seluruh kebijakan RLS
  seed.sql                             # data awal dwibahasa
scripts/
  db.ts                                # runner: seed & reset lewat pg
tests/
  rls/
    baca-publik.spec.ts                # anon baca published, tidak baca draft
    tolak-tulis.spec.ts                # anon tidak bisa menulis apa pun
    analytics-tertutup.spec.ts         # anon tidak bisa membaca analytics
  helpers/
    supabase-anon.ts                   # klien REST anonim untuk test
```

**Batas tanggung jawab.** `scripts/db.ts` satu-satunya yang memegang `SUPABASE_DB_URL`; aplikasi Next.js tidak pernah menyentuh koneksi Postgres langsung — ia hanya bicara REST lewat publishable key, sehingga RLS selalu berlaku padanya.

---

## Task 1: Infrastruktur migrasi

**Files:** `supabase/config.toml`, `.env.local`, `.env.example`, `package.json`, `.gitignore`

- [ ] **Step 1: Buat `supabase/config.toml`**

```toml
project_id = "portofolio-qa"

[db]
major_version = 17
```

- [ ] **Step 2: Tambahkan connection string ke `.env.local`** (tidak di-commit)

```dotenv
# Session pooler portofolio-dev — dipakai HANYA oleh scripts/db.ts, tidak oleh aplikasi.
SUPABASE_DB_URL=postgresql://postgres.sgxepblrfqwbhhpmvaxm:<PASSWORD>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

- [ ] **Step 3: Tambahkan ke `.env.example`** (di-commit, tanpa nilai)

```dotenv
# Session pooler (BUKAN direct/transaction) — Supabase Dashboard → Connect → Session pooler.
# Password wajib percent-encoded. Dipakai hanya oleh scripts/db.ts.
SUPABASE_DB_URL=
```

- [ ] **Step 4: Tambahkan skrip ke `package.json`**

```json
    "db:push": "supabase db push --db-url \"%SUPABASE_DB_URL%\"",
    "db:seed": "tsx scripts/db.ts seed",
    "db:reset": "tsx scripts/db.ts reset",
```

`%SUPABASE_DB_URL%` adalah sintaks Windows dan tidak portabel ke runner Linux di CI. Karena itu `db:push` **tidak dipakai di CI** — CI hanya membaca database yang sudah bermigrasi. Migrasi selalu didorong dari mesin dev.

- [ ] **Step 5: Pasang dependensi**

```powershell
cd D:\portofolio-qa
npm i -D pg@^8.23 @types/pg tsx@^4.23
```

- [ ] **Step 6: Verifikasi CLI membaca connection string**

```powershell
npx supabase@latest db push --dry-run --db-url "<isi SUPABASE_DB_URL>"
```

Harapan: `Connecting to remote database...` lalu melaporkan tidak ada migrasi baru (folder masih kosong). Kalau muncul error autentikasi, password belum benar atau belum percent-encoded.

- [ ] **Step 7: Commit** — `chore: infrastruktur migrasi Supabase tanpa Docker`

---

## Task 2: Migrasi fondasi — enum, validator, trigger

**Files:** `supabase/migrations/20260818000001_fondasi.sql`

- [ ] **Step 1: Tulis migrasi**

```sql
-- Tipe enum dipakai lintas tabel.
create type public.status_publikasi as enum ('draft', 'published');
create type public.status_ketersediaan as enum ('available', 'open', 'unavailable');
create type public.status_studi_kasus as enum ('completed', 'ongoing');
create type public.jenis_event as enum ('cta_click', 'cv_download', 'scroll_depth', 'evidence_click');
create type public.kategori_referrer as enum ('direct', 'linkedin', 'github', 'search', 'other');

-- Penjaga bentuk teks dwibahasa di level database.
-- Zod memvalidasi di aplikasi; ini lapis kedua supaya baris cacat tidak bisa
-- masuk lewat jalur mana pun, termasuk SQL manual di dashboard.
create or replace function public.teks_dwibahasa_valid(v jsonb)
returns boolean
language sql
immutable
as $$
  select v ? 'id'
     and v ? 'en'
     and jsonb_typeof(v -> 'id') = 'string'
     and jsonb_typeof(v -> 'en') = 'string';
$$;

-- Setiap tabel memakai trigger ini agar updated_at tidak bergantung pada
-- kedisiplinan pemanggil.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
```

- [ ] **Step 2: Terapkan**

```powershell
npm run db:push
```

Harapan: migrasi `20260818000001_fondasi` diterapkan.

- [ ] **Step 3: Verifikasi validator benar-benar bekerja**

Jalankan lewat `npx tsx` sebuah query cepat, atau lewat SQL Editor dashboard:

```sql
select public.teks_dwibahasa_valid('{"id":"halo","en":"hello"}'::jsonb) as harus_true,
       public.teks_dwibahasa_valid('{"id":"halo"}'::jsonb)             as harus_false,
       public.teks_dwibahasa_valid('{"id":1,"en":"hello"}'::jsonb)     as harus_false_juga;
```

Harapan: `true, false, false`.

- [ ] **Step 4: Commit** — `feat(db): tipe enum, validator teks dwibahasa, trigger updated_at`

---

## Task 3: Migrasi tabel singleton

**Files:** `supabase/migrations/20260818000002_singleton.sql`

Tiga tabel ini dikunci satu baris. `updated_at` merangkap `last_updated` yang diminta spec — satu sumber kebenaran, terisi otomatis oleh trigger.

- [ ] **Step 1: Tulis migrasi**

```sql
-- ============ site_settings ============
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_title jsonb not null check (public.teks_dwibahasa_valid(site_title)),
  meta_description jsonb not null check (public.teks_dwibahasa_valid(meta_description)),
  og_image jsonb,
  favicon jsonb,
  availability_status public.status_ketersediaan not null default 'open',
  contact_email text not null,
  whatsapp_number text,
  linkedin_url text,
  github_url text,
  resume_pdf text,
  final_cta_headline jsonb not null check (public.teks_dwibahasa_valid(final_cta_headline)),
  final_cta_subtext jsonb not null check (public.teks_dwibahasa_valid(final_cta_subtext)),
  copyright_text jsonb not null check (public.teks_dwibahasa_valid(copyright_text)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ============ hero ============
create table public.hero (
  id smallint primary key default 1 check (id = 1),
  full_name text not null,
  role_title jsonb not null check (public.teks_dwibahasa_valid(role_title)),
  short_intro jsonb not null check (public.teks_dwibahasa_valid(short_intro)),
  key_stats jsonb not null default '[]'::jsonb check (jsonb_typeof(key_stats) = 'array'),
  status_checks jsonb not null default '[]'::jsonb check (jsonb_typeof(status_checks) = 'array'),
  cta_primary jsonb not null,
  cta_secondary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.hero
  for each row execute function public.set_updated_at();

-- ============ about ============
create table public.about (
  id smallint primary key default 1 check (id = 1),
  profile_photo jsonb,
  about_richtext jsonb not null check (public.teks_dwibahasa_valid(about_richtext)),
  highlight_badges jsonb not null default '[]'::jsonb check (jsonb_typeof(highlight_badges) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.about
  for each row execute function public.set_updated_at();
```

- [ ] **Step 2:** `npm run db:push` → harapan: migrasi kedua diterapkan.

- [ ] **Step 3: Verifikasi kunci baris tunggal menggigit**

```sql
insert into public.site_settings (id, site_title, meta_description, contact_email,
  final_cta_headline, final_cta_subtext, copyright_text)
values (2, '{"id":"x","en":"x"}', '{"id":"x","en":"x"}', 'a@b.c',
  '{"id":"x","en":"x"}', '{"id":"x","en":"x"}', '{"id":"x","en":"x"}');
```

Harapan: **GAGAL** dengan pelanggaran check constraint `id = 1`. Kalau berhasil, kuncinya tidak bekerja.

- [ ] **Step 4: Commit** — `feat(db): tabel singleton site_settings, hero, about`

---

## Task 4: Migrasi tabel koleksi

**Files:** `supabase/migrations/20260818000003_koleksi.sql`

- [ ] **Step 1: Tulis migrasi**

```sql
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo jsonb,
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  category_name jsonb not null check (public.teks_dwibahasa_valid(category_name)),
  skills jsonb not null default '[]'::jsonb check (jsonb_typeof(skills) = 'array'),
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  -- Kolom tersimpan, BUKAN turunan sort_order: memindahkan urutan kartu tidak
  -- boleh menggeser nomor yang sudah pernah dibagikan ke orang (keputusan D9).
  test_code text not null unique,
  project_name jsonb not null check (public.teks_dwibahasa_valid(project_name)),
  role jsonb not null check (public.teks_dwibahasa_valid(role)),
  objective jsonb not null check (public.teks_dwibahasa_valid(objective)),
  tools_used jsonb not null default '[]'::jsonb check (jsonb_typeof(tools_used) = 'array'),
  process_steps jsonb not null default '[]'::jsonb check (jsonb_typeof(process_steps) = 'array'),
  result_metrics jsonb not null default '[]'::jsonb check (jsonb_typeof(result_metrics) = 'array'),
  evidence_links jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_links) = 'array'),
  status_badge public.status_studi_kasus not null default 'completed',
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lab_scenarios (
  id uuid primary key default gen_random_uuid(),
  framework_name text not null,
  scenario_title jsonb not null check (public.teks_dwibahasa_valid(scenario_title)),
  scenario_description jsonb not null check (public.teks_dwibahasa_valid(scenario_description)),
  tags jsonb not null default '[]'::jsonb check (jsonb_typeof(tags) = 'array'),
  -- Bentuk steps & result_summary sengaja mengikuti keluaran report asli, supaya
  -- ingest otomatis dari CI kelak cukup mengganti sumber data, bukan skema (D4).
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  result_summary jsonb,
  full_report_url text,
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  company jsonb not null check (public.teks_dwibahasa_valid(company)),
  role jsonb not null check (public.teks_dwibahasa_valid(role)),
  period_start date not null,
  period_end date,
  location text,
  responsibilities jsonb not null default '[]'::jsonb check (jsonb_typeof(responsibilities) = 'array'),
  achievements jsonb not null default '[]'::jsonb check (jsonb_typeof(achievements) = 'array'),
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint periode_masuk_akal check (period_end is null or period_end >= period_start)
);

create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuer text not null,
  year smallint not null check (year between 1990 and 2100),
  credential_url text,
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree jsonb not null check (public.teks_dwibahasa_valid(degree)),
  year smallint not null check (year between 1990 and 2100),
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote jsonb not null check (public.teks_dwibahasa_valid(quote)),
  author_name text not null,
  author_role jsonb not null check (public.teks_dwibahasa_valid(author_role)),
  author_company text,
  photo jsonb,
  sort_order integer not null default 0,
  status public.status_publikasi not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger updated_at untuk kedelapan tabel.
do $$
declare t text;
begin
  foreach t in array array['tools','skill_categories','case_studies','lab_scenarios',
                           'experiences','certifications','education','testimonials']
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Landing selalu mengambil baris published terurut; indeks ini melayani pola itu.
do $$
declare t text;
begin
  foreach t in array array['tools','skill_categories','case_studies','lab_scenarios',
                           'experiences','certifications','education','testimonials']
  loop
    execute format(
      'create index %I on public.%I (status, sort_order)', 'idx_' || t || '_status_urut', t);
  end loop;
end $$;
```

- [ ] **Step 2:** `npm run db:push`

- [ ] **Step 3: Verifikasi `test_code` unik menggigit** — sisipkan dua baris `case_studies` dengan `test_code` sama; yang kedua harus GAGAL.

- [ ] **Step 4: Commit** — `feat(db): delapan tabel koleksi + indeks status/urutan`

---

## Task 5: Migrasi analytics

**Files:** `supabase/migrations/20260818000004_analytics.sql`

- [ ] **Step 1: Tulis migrasi**

```sql
-- Tabel log: append-only, tidak punya sort_order maupun status.
-- Tidak menyimpan IP, user-agent mentah, atau apa pun yang mengidentifikasi
-- individu — itulah sebabnya situs ini tidak butuh consent banner (D11).
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type public.jenis_event not null,
  event_label text,
  locale text not null check (locale in ('id', 'en')),
  path text not null,
  referrer_category public.kategori_referrer not null default 'direct',
  created_at timestamptz not null default now()
);

create index idx_analytics_waktu on public.analytics_events (created_at desc);
create index idx_analytics_jenis on public.analytics_events (event_type, created_at desc);
```

- [ ] **Step 2:** `npm run db:push`
- [ ] **Step 3: Commit** — `feat(db): tabel analytics_events tanpa PII`

---

## Task 6: RLS — kebijakan dan buktinya

Ini task paling penting di fase ini. Kebijakan yang tidak diuji hanyalah niat.

**Files:** `supabase/migrations/20260818000005_rls.sql`, `tests/helpers/supabase-anon.ts`, `tests/rls/*.spec.ts`, `playwright.config.ts`

- [ ] **Step 1: Tulis migrasi RLS**

```sql
-- Aktifkan RLS di SEMUA tabel. Tanpa kebijakan, RLS aktif berarti tertutup total.
do $$
declare t text;
begin
  foreach t in array array['site_settings','hero','about','tools','skill_categories',
                           'case_studies','lab_scenarios','experiences','certifications',
                           'education','testimonials','analytics_events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Singleton: konten situs, boleh dibaca siapa pun.
do $$
declare t text;
begin
  foreach t in array array['site_settings','hero','about']
  loop
    execute format(
      'create policy "baca publik" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- Koleksi: publik hanya boleh membaca baris published.
-- Draft tidak pernah bocor ke landing bahkan jika ada bug di kode aplikasi.
do $$
declare t text;
begin
  foreach t in array array['tools','skill_categories','case_studies','lab_scenarios',
                           'experiences','certifications','education','testimonials']
  loop
    execute format(
      'create policy "baca publik hanya published" on public.%I
         for select to anon using (status = ''published'')', t);
    execute format(
      'create policy "pemilik baca semua" on public.%I
         for select to authenticated using (true)', t);
  end loop;
end $$;

-- Tulis: hanya user terautentikasi, di seluruh tabel konten.
do $$
declare t text;
begin
  foreach t in array array['site_settings','hero','about','tools','skill_categories',
                           'case_studies','lab_scenarios','experiences','certifications',
                           'education','testimonials']
  loop
    execute format('create policy "tulis pemilik" on public.%I
                      for insert to authenticated with check (true)', t);
    execute format('create policy "ubah pemilik" on public.%I
                      for update to authenticated using (true) with check (true)', t);
    execute format('create policy "hapus pemilik" on public.%I
                      for delete to authenticated using (true)', t);
  end loop;
end $$;

-- analytics_events: TIDAK ada kebijakan untuk anon sama sekali.
-- Menulis dilakukan route handler sisi server memakai secret key (Fase 3);
-- membiarkan anon menyisipkan langsung membuka pintu spam yang tak bisa
-- dibatasi di level RLS.
create policy "analytics dibaca pemilik" on public.analytics_events
  for select to authenticated using (true);
```

- [ ] **Step 2:** `npm run db:push`

- [ ] **Step 3: Buat helper klien anonim**

`tests/helpers/supabase-anon.ts`:

```ts
/**
 * Klien REST anonim — sengaja memakai HTTP mentah, bukan supabase-js,
 * agar test menguji apa yang benar-benar dijawab server, bukan apa yang
 * disimpulkan library.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export function headerAnon(): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export function urlTabel(tabel: string, query = ''): string {
  return `${SUPABASE_URL}/rest/v1/${tabel}${query}`
}
```

- [ ] **Step 4: Tulis test baca publik**

`tests/rls/baca-publik.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { headerAnon, urlTabel } from '../helpers/supabase-anon'

const KOLEKSI = [
  'tools', 'skill_categories', 'case_studies', 'lab_scenarios',
  'experiences', 'certifications', 'education', 'testimonials',
] as const

test.describe('RLS — pembacaan oleh klien anonim', () => {
  for (const tabel of KOLEKSI) {
    test(`${tabel}: anon hanya menerima baris published`, async ({ request }) => {
      const res = await request.get(urlTabel(tabel, '?select=status'), { headers: headerAnon() })
      expect(res.status()).toBe(200)

      const baris = (await res.json()) as Array<{ status: string }>
      expect(baris.length, `${tabel} harus punya data seed`).toBeGreaterThan(0)
      expect(baris.every((b) => b.status === 'published')).toBe(true)
    })

    test(`${tabel}: filter status=draft mengembalikan nol baris`, async ({ request }) => {
      const res = await request.get(urlTabel(tabel, '?select=id&status=eq.draft'), {
        headers: headerAnon(),
      })
      expect(res.status()).toBe(200)
      expect(await res.json()).toEqual([])
    })
  }

  for (const tabel of ['site_settings', 'hero', 'about'] as const) {
    test(`${tabel}: singleton bisa dibaca publik`, async ({ request }) => {
      const res = await request.get(urlTabel(tabel, '?select=id'), { headers: headerAnon() })
      expect(res.status()).toBe(200)
      expect((await res.json()).length).toBe(1)
    })
  }
})
```

- [ ] **Step 5: Tulis test tolak tulis**

`tests/rls/tolak-tulis.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { headerAnon, urlTabel } from '../helpers/supabase-anon'

const SEMUA_KONTEN = [
  'site_settings', 'hero', 'about', 'tools', 'skill_categories',
  'case_studies', 'lab_scenarios', 'experiences', 'certifications',
  'education', 'testimonials',
] as const

test.describe('RLS — klien anonim tidak boleh menulis', () => {
  for (const tabel of SEMUA_KONTEN) {
    test(`${tabel}: INSERT anon ditolak`, async ({ request }) => {
      const res = await request.post(urlTabel(tabel), {
        headers: headerAnon(),
        data: { sort_order: 999 },
      })
      // 401/403 = ditolak RLS, 400 = ditolak sebelum sampai kebijakan.
      // Yang penting: TIDAK BOLEH 2xx.
      expect(res.status(), `${tabel} menerima INSERT anonim`).toBeGreaterThanOrEqual(400)
    })

    test(`${tabel}: DELETE massal anon tidak menghapus apa pun`, async ({ request }) => {
      const sebelum = await request.get(urlTabel(tabel, '?select=id'), { headers: headerAnon() })
      const jumlahSebelum = ((await sebelum.json()) as unknown[]).length

      await request.delete(urlTabel(tabel, '?id=not.is.null'), { headers: headerAnon() })

      const sesudah = await request.get(urlTabel(tabel, '?select=id'), { headers: headerAnon() })
      const jumlahSesudah = ((await sesudah.json()) as unknown[]).length

      expect(jumlahSesudah, `${tabel} kehilangan baris setelah DELETE anonim`).toBe(jumlahSebelum)
    })
  }
})
```

Test DELETE sengaja memeriksa **jumlah baris**, bukan status respons. PostgREST menjawab `204` untuk DELETE yang tidak mengenai baris apa pun — jadi memeriksa status saja akan lulus meski RLS bocor.

- [ ] **Step 6: Tulis test analytics tertutup**

`tests/rls/analytics-tertutup.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { headerAnon, urlTabel } from '../helpers/supabase-anon'

test('analytics_events tidak bisa dibaca klien anonim', async ({ request }) => {
  const res = await request.get(urlTabel('analytics_events', '?select=id'), {
    headers: headerAnon(),
  })

  if (res.status() === 200) {
    // RLS tanpa kebijakan SELECT untuk anon menghasilkan himpunan kosong,
    // bukan error. Kosong = tertutup; berisi = bocor.
    expect(await res.json()).toEqual([])
  } else {
    expect(res.status()).toBeGreaterThanOrEqual(400)
  }
})

test('analytics_events tidak bisa ditulis klien anonim', async ({ request }) => {
  const res = await request.post(urlTabel('analytics_events'), {
    headers: headerAnon(),
    data: { event_type: 'cta_click', locale: 'id', path: '/id' },
  })
  expect(res.status()).toBeGreaterThanOrEqual(400)
})
```

- [ ] **Step 7: Daftarkan folder RLS ke Playwright**

Di `playwright.config.ts`, ubah `testMatch` menjadi:

```ts
  testMatch: ['e2e/**/*.spec.ts', 'api/**/*.spec.ts', 'rls/**/*.spec.ts'],
```

- [ ] **Step 8: Jalankan** — `npm run test:e2e`. Semua RLS harus hijau **setelah Task 7 (seed) selesai**; sebelum ada seed, test "harus punya data seed" akan gagal. Kerjakan Task 7 lebih dulu bila perlu, lalu kembali.

- [ ] **Step 9: Commit** — `feat(db): kebijakan RLS + suite bukti penolakan anonim`

---

## Task 7: Seed dwibahasa

**Files:** `supabase/seed.sql`, `scripts/db.ts`

- [ ] **Step 1: Tulis `scripts/db.ts`**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'

const TABEL = [
  'analytics_events', 'testimonials', 'education', 'certifications', 'experiences',
  'lab_scenarios', 'case_studies', 'skill_categories', 'tools', 'about', 'hero', 'site_settings',
] as const

function connectionString(): string {
  const url = process.env.SUPABASE_DB_URL
  if (!url) {
    throw new Error(
      'SUPABASE_DB_URL belum diset. Ambil Session pooler dari Supabase Dashboard → Connect.',
    )
  }
  return url
}

async function jalankan(perintah: string) {
  const client = new Client({ connectionString: connectionString() })
  await client.connect()
  try {
    if (perintah === 'reset') {
      // TRUNCATE seluruh tabel dalam satu transaksi supaya keadaan awal
      // selalu identik, berapa kali pun dijalankan.
      await client.query(`truncate table ${TABEL.map((t) => `public.${t}`).join(', ')} cascade`)
      console.log(`Dikosongkan: ${TABEL.length} tabel`)
    }

    const seed = readFileSync(resolve(process.cwd(), 'supabase/seed.sql'), 'utf8')
    await client.query(seed)
    console.log('Seed dimuat')
  } finally {
    await client.end()
  }
}

const perintah = process.argv[2]
if (perintah !== 'seed' && perintah !== 'reset') {
  console.error('Pemakaian: tsx scripts/db.ts <seed|reset>')
  process.exit(1)
}

jalankan(perintah).catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
```

- [ ] **Step 2: Tulis `supabase/seed.sql`**

Seed harus **idempoten** (memakai `on conflict do nothing`) supaya `db:seed` tanpa reset tidak menggandakan baris. Isi dengan konten yang **dianonimkan** sesuai keputusan D5 — jangan sebut nama perusahaan mana pun.

```sql
insert into public.site_settings (id, site_title, meta_description, availability_status,
  contact_email, whatsapp_number, linkedin_url, github_url,
  final_cta_headline, final_cta_subtext, copyright_text)
values (1,
  '{"id":"Portofolio QA Engineer","en":"QA Engineer Portfolio"}',
  '{"id":"QA Engineer dengan pengalaman manual & automation testing lintas web, mobile, dan API.","en":"QA Engineer experienced in manual & automation testing across web, mobile, and API."}',
  'open', 'kontak@contoh.dev', '+628000000000',
  'https://www.linkedin.com/in/contoh', 'https://github.com/contoh',
  '{"id":"Siap membantu tim kamu rilis dengan lebih tenang.","en":"Ready to help your team ship with confidence."}',
  '{"id":"Terbuka untuk peluang full-time maupun kolaborasi proyek freelance.","en":"Open to full-time roles and freelance collaboration."}',
  '{"id":"© 2026","en":"© 2026"}')
on conflict (id) do nothing;

insert into public.hero (id, full_name, role_title, short_intro, key_stats, status_checks,
  cta_primary, cta_secondary)
values (1, 'Nama Lengkap',
  '{"id":"QA Engineer — Manual & Automation Testing","en":"QA Engineer — Manual & Automation Testing"}',
  '{"id":"Merancang test strategy, membangun automation framework, dan menekan defect leakage.","en":"Designing test strategy, building automation frameworks, and reducing defect leakage."}',
  '[{"label":{"id":"Tahun Pengalaman","en":"Years of Experience"},"value":"4+"},
    {"label":{"id":"Test Case Dieksekusi","en":"Test Cases Executed"},"value":"1.200+"},
    {"label":{"id":"Bug Ditemukan","en":"Bugs Found"},"value":"350+"},
    {"label":{"id":"Automation Coverage","en":"Automation Coverage"},"value":"70%"}]'::jsonb,
  '[{"label":{"id":"Manual Testing","en":"Manual Testing"},"status":"pass","duration_label":"340ms"},
    {"label":{"id":"Automation (Playwright)","en":"Automation (Playwright)"},"status":"pass","duration_label":"280ms"},
    {"label":{"id":"API Testing","en":"API Testing"},"status":"pass","duration_label":"190ms"},
    {"label":{"id":"Ketersediaan","en":"Availability"},"status":"pass","duration_label":"Open"}]'::jsonb,
  '{"label":{"id":"Hubungi Saya","en":"Contact Me"},"link":"#kontak"}'::jsonb,
  '{"label":{"id":"Unduh CV","en":"Download CV"},"link":"#"}'::jsonb)
on conflict (id) do nothing;

insert into public.about (id, about_richtext, highlight_badges)
values (1,
  '{"id":"Quality bukan cuma mencari bug, tapi membangun kepercayaan pada rilis.","en":"Quality is not just finding bugs — it is building confidence in every release."}',
  '[{"text":{"id":"Manual & Automation","en":"Manual & Automation"}},
    {"text":{"id":"Agile / Scrum","en":"Agile / Scrum"}}]'::jsonb)
on conflict (id) do nothing;

-- Koleksi: setiap tabel WAJIB punya minimal satu baris published dan satu draft,
-- supaya test RLS punya keduanya untuk dibedakan.
insert into public.tools (name, sort_order, status) values
  ('Playwright', 1, 'published'),
  ('Postman', 2, 'published'),
  ('k6', 3, 'published'),
  ('Tool Draft', 99, 'draft')
on conflict do nothing;

insert into public.skill_categories (category_name, skills, sort_order, status) values
  ('{"id":"Manual Testing","en":"Manual Testing"}',
   '[{"name":"Test Case Design","proficiency_percent":90,"years":4},
     {"name":"Exploratory Testing","proficiency_percent":85,"years":4}]'::jsonb, 1, 'published'),
  ('{"id":"Automation Testing","en":"Automation Testing"}',
   '[{"name":"Playwright","proficiency_percent":85,"years":3},
     {"name":"CI/CD Integration","proficiency_percent":70,"years":2}]'::jsonb, 2, 'published'),
  ('{"id":"Kategori Draft","en":"Draft Category"}', '[]'::jsonb, 99, 'draft')
on conflict do nothing;

insert into public.case_studies (test_code, project_name, role, objective, tools_used,
  process_steps, result_metrics, evidence_links, status_badge, sort_order, status) values
  ('TC-001',
   '{"id":"Platform Properti B2C","en":"B2C Property Platform"}',
   '{"id":"QA Engineer","en":"QA Engineer"}',
   '{"id":"Regression manual memakan waktu berhari-hari tiap rilis.","en":"Manual regression took days for every release."}',
   '["Playwright","TypeScript","GitHub Actions"]'::jsonb,
   '[{"text":{"id":"Memetakan alur kritis","en":"Mapped critical flows"}}]'::jsonb,
   '[{"label":{"id":"Waktu Regression","en":"Regression Time"},"value":"3 hari → 4 jam"}]'::jsonb,
   '[]'::jsonb, 'completed', 1, 'published'),
  ('TC-002',
   '{"id":"Aplikasi Mobile Marketplace","en":"Mobile Marketplace App"}',
   '{"id":"QA Engineer","en":"QA Engineer"}',
   '{"id":"Alur pembayaran belum punya cakupan otomatis.","en":"The payment flow had no automated coverage."}',
   '["Playwright","k6"]'::jsonb,
   '[{"text":{"id":"Menyusun test plan","en":"Built the test plan"}}]'::jsonb,
   '[{"label":{"id":"Bug Kritis di Produksi","en":"Critical Bugs in Production"},"value":"0"}]'::jsonb,
   '[]'::jsonb, 'completed', 2, 'published'),
  ('TC-999', '{"id":"Draft","en":"Draft"}', '{"id":"QA","en":"QA"}',
   '{"id":"Belum tayang.","en":"Not published yet."}',
   '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'ongoing', 99, 'draft')
on conflict (test_code) do nothing;

insert into public.lab_scenarios (framework_name, scenario_title, scenario_description, tags,
  steps, result_summary, sort_order, status) values
  ('Playwright',
   '{"id":"Login & Checkout End-to-End","en":"End-to-End Login & Checkout"}',
   '{"id":"Login, tambah ke keranjang, checkout, verifikasi order.","en":"Log in, add to cart, check out, verify the order."}',
   '["TypeScript","Playwright"]'::jsonb,
   '[{"label":{"id":"Membuka halaman login","en":"Opening the login page"},"duration_ms":850,"status":"pass"},
     {"label":{"id":"Verifikasi order berhasil","en":"Verifying the order succeeded"},"duration_ms":600,"status":"pass"}]'::jsonb,
   '{"total":6,"passed":6,"failed":0,"duration":"4.1s"}'::jsonb, 1, 'published'),
  ('k6', '{"id":"Skenario Draft","en":"Draft Scenario"}',
   '{"id":"Belum tayang.","en":"Not published yet."}', '[]'::jsonb, '[]'::jsonb, null, 99, 'draft')
on conflict do nothing;

insert into public.experiences (company, role, period_start, period_end, location,
  responsibilities, achievements, sort_order, status) values
  ('{"id":"Platform Properti B2C","en":"B2C Property Platform"}',
   '{"id":"QA Engineer","en":"QA Engineer"}', '2022-01-01', null, 'Indonesia',
   '[{"text":{"id":"Membangun suite automation lintas web, mobile, dan API.","en":"Built automation suites across web, mobile, and API."}}]'::jsonb,
   '[{"text":{"id":"Memangkas waktu regression secara signifikan.","en":"Cut regression time significantly."}}]'::jsonb,
   1, 'published'),
  ('{"id":"Perusahaan Draft","en":"Draft Company"}', '{"id":"QA","en":"QA"}',
   '2020-01-01', '2021-12-31', 'Indonesia', '[]'::jsonb, '[]'::jsonb, 99, 'draft')
on conflict do nothing;

insert into public.certifications (name, issuer, year, sort_order, status) values
  ('ISTQB Foundation Level', 'ISTQB', 2022, 1, 'published'),
  ('Sertifikat Draft', 'Draft', 2020, 99, 'draft')
on conflict do nothing;

insert into public.education (institution, degree, year, sort_order, status) values
  ('Universitas', '{"id":"S1 Teknik Informatika","en":"B.Sc. Informatics"}', 2019, 1, 'published'),
  ('Draft', '{"id":"Draft","en":"Draft"}', 2015, 99, 'draft')
on conflict do nothing;

insert into public.testimonials (quote, author_name, author_role, author_company,
  sort_order, status) values
  ('{"id":"Konsisten menemukan edge case yang terlewat tim lain.","en":"Consistently finds edge cases the rest of the team misses."}',
   'Rekan Kerja', '{"id":"Engineering Lead","en":"Engineering Lead"}', null, 1, 'published'),
  ('{"id":"Draft.","en":"Draft."}', 'Draft', '{"id":"Draft","en":"Draft"}', null, 99, 'draft')
on conflict do nothing;
```

- [ ] **Step 3: Jalankan** — `npm run db:seed`, lalu `npm run test:e2e`. Seluruh test RLS harus hijau.

- [ ] **Step 4: Commit** — `feat(db): seed dwibahasa + skrip seed/reset berbasis pg`

---

## Task 8: Determinisme reset dan integrasi CI

- [ ] **Step 1: Buktikan reset benar-benar idempoten**

```powershell
npm run db:reset
npm run test:e2e
npm run db:reset
npm run test:e2e
```

Keduanya harus memberi hasil identik. Kalau jumlah baris bertambah di putaran kedua, `on conflict` di seed belum menutupi semua tabel — perbaiki, jangan diakali dengan menghapus assertion.

- [ ] **Step 2: Uji daya gigit RLS lewat mutasi**

Sementara longgarkan satu kebijakan lewat SQL Editor dashboard:

```sql
drop policy "baca publik hanya published" on public.case_studies;
create policy "baca publik hanya published" on public.case_studies
  for select to anon using (true);
```

Jalankan `npm run test:e2e`. Harapan: test `case_studies: anon hanya menerima baris published` **GAGAL**. Kalau tetap hijau, test-nya tidak menguji apa pun.

Pulihkan:

```sql
drop policy "baca publik hanya published" on public.case_studies;
create policy "baca publik hanya published" on public.case_studies
  for select to anon using (status = 'published');
```

Jalankan lagi dan pastikan hijau.

- [ ] **Step 3: Verifikasi CI**

`ci.yml` tidak perlu diubah — `npm run test:e2e` sudah mencakup folder `rls/`, dan secret Supabase sudah tersedia di runner. Push dan pastikan CI hijau dengan jumlah test bertambah.

- [ ] **Step 4: Commit** — `test(db): verifikasi determinisme reset dan daya gigit RLS`

---

## Verifikasi akhir Fase 1a

- [ ] `npm run db:reset` dua kali berturut-turut memberi keadaan identik
- [ ] `npm run test:e2e` hijau, mencakup suite RLS
- [ ] Mutasi kebijakan RLS membuat test gagal (dibuktikan di Task 8 Step 2)
- [ ] CI hijau
- [ ] `git status` bersih; `SUPABASE_DB_URL` tidak pernah masuk riwayat git
- [ ] U-1 di `UTANG-TERBUKA.md` sudah lunas

## Catatan untuk Fase 1b

- Bentuk `LocalizedText` dan `MediaRef` sudah terkunci di DB — tipe TypeScript di Fase 1b harus diturunkan dari bentuk ini, bukan ditulis ulang secara terpisah.
- Indeks `(status, sort_order)` sudah ada; query landing harus memakai pola itu agar terpakai.
- Setiap koleksi punya minimal satu baris `draft` di seed. Fase 1b wajib menambah test E2E yang membuktikan baris draft itu **tidak muncul** di halaman.
