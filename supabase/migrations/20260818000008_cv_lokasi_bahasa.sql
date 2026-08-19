-- Dua kolom yang dibutuhkan CV tapi belum ada di skema.
--
-- CV yang di-generate mengambil seluruh isinya dari database, sehingga
-- memperbarui pengalaman di admin otomatis memperbarui CV-nya. Dua data ini
-- ada di CV tapi tidak punya tempat: lokasi (dipakai di blok kontak) dan
-- daftar bahasa beserta tingkatannya.
--
-- `location` sengaja di site_settings, bukan diturunkan dari experiences —
-- lokasi di CV adalah domisili orangnya sekarang, bukan lokasi kantor
-- pekerjaan terakhirnya. Keduanya kebetulan sering sama, tapi maknanya beda.

alter table public.site_settings
  add column if not exists location text,
  add column if not exists languages jsonb not null default '[]'::jsonb
    check (jsonb_typeof(languages) = 'array');

comment on column public.site_settings.location is
  'Domisili yang tampil di blok kontak CV, mis. "Sidoarjo, Indonesia".';
comment on column public.site_settings.languages is
  'Array {name, level} — mis. [{"name":"Indonesia","level":"Native"}].';
