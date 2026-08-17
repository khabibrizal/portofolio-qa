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
