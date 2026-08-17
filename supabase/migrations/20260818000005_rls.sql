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
