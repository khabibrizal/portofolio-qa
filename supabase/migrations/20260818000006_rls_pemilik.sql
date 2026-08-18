-- Memperketat gerbang tulis: dari "terautentikasi" menjadi "pemilik".
--
-- Sampai migrasi ini, satu-satunya syarat menulis ke sebelas tabel konten
-- adalah memiliki sesi terautentikasi. Itu cukup HANYA selama pendaftaran
-- publik tertutup — dan pendaftaran publik adalah satu sakelar di dashboard
-- yang bisa berubah tanpa meninggalkan jejak di repo, tanpa membuat satu pun
-- test berubah warna, dan tanpa siapa pun menyadarinya.
--
-- Sempat terbukti demikian: proyek ini berjalan live dengan pendaftaran masih
-- terbuka, yang berarti siapa pun bisa mendaftar lewat endpoint publik,
-- memperoleh peran `authenticated`, lalu mengubah seluruh isi portofolio.
-- Kunci publishable memang dirancang tampil di browser, jadi ia sudah ada di
-- tangan setiap pengunjung.
--
-- Setelah migrasi ini, mematikan sakelar itu bukan lagi satu-satunya yang
-- menahan. Gerbangnya ada di database, terbaca di repo, dan bisa diuji.

create table public.pemilik (
  uid uuid primary key references auth.users (id) on delete cascade,
  catatan text,
  created_at timestamptz not null default now()
);

alter table public.pemilik enable row level security;
alter table public.pemilik force row level security;

-- Sengaja TANPA kebijakan apa pun: daftar pemilik hanya boleh berubah lewat
-- migrasi, tidak lewat aplikasi. Tabel ber-RLS tanpa kebijakan tertutup total.

insert into public.pemilik (uid, catatan)
values ('c2dd6abe-83f0-4083-9899-b0188704133e', 'akun admin tunggal');

-- security definer supaya fungsi ini tetap bisa membaca tabel yang tertutup
-- itu. Ia hanya mengembalikan boolean, jadi tidak ada isi yang bisa bocor.
-- search_path dikunci agar nama tabel di dalamnya tidak bisa dibajak.
create or replace function public.adalah_pemilik()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.pemilik where uid = auth.uid());
$$;

revoke all on function public.adalah_pemilik() from public;
grant execute on function public.adalah_pemilik() to authenticated;

-- Ganti seluruh kebijakan tulis dan baca-draft di tabel konten.
do $$
declare
  t text;
  konten text[] := array[
    'site_settings', 'hero', 'about', 'tools', 'skill_categories',
    'case_studies', 'lab_scenarios', 'experiences', 'certifications',
    'education', 'testimonials'
  ];
begin
  foreach t in array konten
  loop
    execute format('drop policy if exists "tulis pemilik" on public.%I', t);
    execute format('drop policy if exists "ubah pemilik" on public.%I', t);
    execute format('drop policy if exists "hapus pemilik" on public.%I', t);

    execute format(
      'create policy "tulis pemilik" on public.%I
         for insert to authenticated with check (public.adalah_pemilik())', t);
    execute format(
      'create policy "ubah pemilik" on public.%I
         for update to authenticated
         using (public.adalah_pemilik()) with check (public.adalah_pemilik())', t);
    execute format(
      'create policy "hapus pemilik" on public.%I
         for delete to authenticated using (public.adalah_pemilik())', t);
  end loop;
end $$;

-- Membaca draft juga hak pemilik, bukan hak setiap akun terautentikasi.
do $$
declare
  t text;
  koleksi text[] := array[
    'tools', 'skill_categories', 'case_studies', 'lab_scenarios',
    'experiences', 'certifications', 'education', 'testimonials'
  ];
begin
  foreach t in array koleksi
  loop
    execute format('drop policy if exists "pemilik baca semua" on public.%I', t);
    execute format(
      'create policy "pemilik baca semua" on public.%I
         for select to authenticated using (public.adalah_pemilik())', t);
  end loop;
end $$;

-- Analytics: hanya pemilik yang boleh membacanya.
drop policy if exists "analytics dibaca pemilik" on public.analytics_events;
create policy "analytics dibaca pemilik" on public.analytics_events
  for select to authenticated using (public.adalah_pemilik());
