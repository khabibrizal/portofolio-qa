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
