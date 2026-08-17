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
