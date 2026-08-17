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
