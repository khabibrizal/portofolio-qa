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
  steps, result_summary, full_report_url, sort_order, status) values
  ('Playwright',
   '{"id":"Login & Checkout End-to-End","en":"End-to-End Login & Checkout"}',
   '{"id":"Login, tambah ke keranjang, checkout, verifikasi order.","en":"Log in, add to cart, check out, verify the order."}',
   '["TypeScript","Playwright"]'::jsonb,
   '[{"label":{"id":"Membuka halaman login","en":"Opening the login page"},"duration_ms":850,"status":"pass"},
     {"label":{"id":"Verifikasi order berhasil","en":"Verifying the order succeeded"},"duration_ms":600,"status":"pass"}]'::jsonb,
   '{"total":6,"passed":6,"failed":0,"duration":"4.1s"}'::jsonb, null, 1, 'published'),
  -- Skenario published KEDUA, dan alasannya bukan variasi konten: dengan satu tab
  -- saja, perpindahan tab dan pembersihan timer di tengah replay tidak bisa diuji
  -- sama sekali, padahal itu logika paling rawan di Automation Lab. Baris ini juga
  -- satu-satunya yang mengisi full_report_url, sehingga cabang tombol "Lihat Report
  -- Lengkap" ikut tereksekusi — sebelumnya cabang itu tak pernah dijalankan.
  ('k6',
   '{"id":"Uji Beban Endpoint Pencarian","en":"Search Endpoint Load Test"}',
   '{"id":"Menaikkan beban bertahap sampai 200 pengguna serentak sambil memantau p95.","en":"Ramping load to 200 concurrent users while watching p95."}',
   '["JavaScript","k6"]'::jsonb,
   '[{"label":{"id":"Menyiapkan skenario ramping","en":"Preparing the ramping scenario"},"duration_ms":400,"status":"pass"},
     {"label":{"id":"Menaikkan beban ke 200 VU","en":"Ramping load to 200 VUs"},"duration_ms":500,"status":"pass"},
     {"label":{"id":"Verifikasi ambang p95 terpenuhi","en":"Verifying the p95 threshold holds"},"duration_ms":450,"status":"pass"}]'::jsonb,
   '{"total":3,"passed":3,"failed":0,"duration":"1.4s"}'::jsonb,
   'https://example.com/laporan/uji-beban-pencarian', 2, 'published'),
  ('Appium', '{"id":"Skenario Draft","en":"Draft Scenario"}',
   '{"id":"Belum tayang.","en":"Not published yet."}', '[]'::jsonb, '[]'::jsonb, null, null, 99, 'draft')
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

-- Satu sertifikat sengaja diberi credential_url dan satu lagi tidak: tanpa
-- keduanya, cabang 'kartu dibungkus tautan' atau cabang 'kartu polos' pasti ada
-- yang tak pernah tereksekusi test mana pun.
insert into public.certifications (name, issuer, year, credential_url, sort_order, status) values
  ('ISTQB Foundation Level', 'ISTQB', 2022, 'https://example.com/kredensial/istqb-fl', 1, 'published'),
  ('Certified Tester Agile', 'ISTQB', 2023, null, 2, 'published'),
  ('Sertifikat Draft', 'Draft', 2020, null, 99, 'draft')
on conflict do nothing;

insert into public.education (institution, degree, year, sort_order, status) values
  ('Universitas', '{"id":"S1 Teknik Informatika","en":"B.Sc. Informatics"}', 2019, 1, 'published'),
  ('Institusi Draft Tak Tayang', '{"id":"Draft","en":"Draft"}', 2015, 99, 'draft')
on conflict do nothing;

insert into public.testimonials (quote, author_name, author_role, author_company,
  sort_order, status) values
  ('{"id":"Konsisten menemukan edge case yang terlewat tim lain.","en":"Consistently finds edge cases the rest of the team misses."}',
   'Rekan Kerja', '{"id":"Engineering Lead","en":"Engineering Lead"}', null, 1, 'published'),
  ('{"id":"Draft.","en":"Draft."}', 'Penulis Draft Tak Tayang', '{"id":"Draft","en":"Draft"}', null, 99, 'draft')
on conflict do nothing;

-- analytics_events sengaja diberi isi meski penulisannya baru dibangun di Fase 3.
-- Alasannya bukan demo data: tanpa satu pun baris, test "anon tidak bisa membaca
-- analytics" tidak bisa membedakan "ditutup RLS" dari "tabelnya memang kosong",
-- sehingga tetap hijau walau kebijakannya bocor. Dibuktikan lewat mutasi.
insert into public.analytics_events (event_type, event_label, locale, path, referrer_category)
select * from (values
  ('cta_click'::public.jenis_event,   'hubungi-saya', 'id', '/id', 'linkedin'::public.kategori_referrer),
  ('cv_download'::public.jenis_event, 'unduh-cv',     'en', '/en', 'direct'::public.kategori_referrer)
) as v(event_type, event_label, locale, path, referrer_category)
where not exists (select 1 from public.analytics_events);
