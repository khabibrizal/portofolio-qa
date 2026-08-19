-- Cuplikan kode dan tautan repo untuk tiap skenario Automation Lab.
--
-- Sampai sekarang section itu hanya memutar ulang langkah dan angka hasil.
-- Yang paling ingin dilihat rekruter teknis justru tidak ada: kodenya sendiri.
-- Angka bisa diketik siapa saja; kode yang rapi tidak.
--
-- `kode` disimpan apa adanya sebagai teks, TIDAK dwibahasa — kode tidak
-- diterjemahkan, dan memaksanya ke bentuk {id, en} hanya membuat pemilik
-- menyalin isi yang sama dua kali lalu keduanya menyimpang.
--
-- `repo_url` menunjuk berkas sumbernya di GitHub. Cuplikan bisa basi; tautan
-- ke sumbernya tidak, dan pembaca yang ingin memastikan bisa membukanya
-- sendiri. Keduanya saling menutupi kelemahan.

alter table public.lab_scenarios
  add column if not exists kode text,
  add column if not exists kode_bahasa text,
  add column if not exists repo_url text;

comment on column public.lab_scenarios.kode is
  'Cuplikan kode yang ditampilkan di Automation Lab. Apa adanya, tanpa terjemahan.';
comment on column public.lab_scenarios.kode_bahasa is
  'Label bahasa untuk ditampilkan di atas cuplikan, mis. "TypeScript" atau "Gherkin".';
comment on column public.lab_scenarios.repo_url is
  'Tautan ke berkas sumbernya di GitHub, supaya cuplikan yang basi tetap bisa diperiksa.';
