# Desain: Landing Page Portofolio QA Engineer + Admin CMS

**Tanggal:** 2026-08-17
**Status:** Disetujui, siap masuk rencana implementasi
**Repo:** `D:\portofolio-qa` (repo tersendiri, terpisah dari repo pekerjaan)

---

## 1. Tujuan

Satu landing page publik yang membuat rekruter, hiring manager, atau calon klien freelance percaya bahwa pemiliknya kompeten sebagai QA Engineer (manual + automation), lalu mengklik salah satu CTA kontak.

Seluruh konten halaman — teks, angka, gambar, link — berasal dari database dan diubah lewat halaman admin. Tidak ada konten yang di-hardcode di halaman.

**Metrik keberhasilan:** klik CTA kontak (email/WhatsApp/LinkedIn), unduh CV, kedalaman scroll ke section Studi Kasus & Pengalaman, klik ke link bukti kerja.

---

## 2. Keputusan yang sudah diambil

| # | Keputusan | Alasan |
|---|---|---|
| D1 | Hosting free tier: Vercel Hobby + Supabase free | Tanpa biaya bulanan; hanya domain (~Rp 180rb/tahun) |
| D2 | Dwibahasa ID + EN | Menjangkau rekruter lokal sekaligus peluang remote |
| D3 | Stack: Next.js 16 (App Router) + TypeScript + Supabase + admin custom | Dipilih di atas Payload CMS; satu vendor untuk DB/Auth/Storage, kontrol penuh, kode milik sendiri |
| D4 | Konten Automation Lab diisi manual lewat admin | Skema tetap dirancang kompatibel dengan ingest otomatis dari CI di kemudian hari, tanpa migrasi |
| D5 | Nama perusahaan pada studi kasus disamarkan; angka hasil tetap asli | Menjaga kerahasiaan employer; angka tetap meyakinkan tanpa melanggar apa pun |
| D6 | Proyek ini punya suite test + CI sendiri, dengan badge publik di footer | Portofolio QA yang tidak menerapkan standarnya sendiri melemahkan klaimnya |
| D7 | Teks dwibahasa disimpan sebagai JSONB `{id, en}` | Menghindari ~80 kolom kembar; menambah bahasa tidak butuh migrasi |
| D8 | Repeater jadi tabel hanya jika perlu urutan/publish/query mandiri; selebihnya JSONB array | Mencegah skema membengkak jadi 20 tabel yang mayoritas cuma di-join balik |
| D9 | `test_code` (TC-001) kolom tersimpan, bukan turunan `sort_order` | Reorder tidak boleh menggeser nomor yang sudah pernah dibagikan |
| D10 | Media disematkan sebagai JSONB, tanpa media library | Portofolio hanya punya belasan gambar; library takkan terpakai |
| D11 | Analytics dibangun sendiri di Postgres, tanpa PII | Gratis, tanpa vendor ketiga, tanpa consent banner |
| D12 | i18n berbasis path (`/id`, `/en`), bukan toggle klien | Dua URL terindeks; toggle JS hanya memberi satu halaman terindeks |
| D13 | Landing page (Fase 1) dikerjakan sebelum admin (Fase 2), dengan seed SQL | Kesalahan skema ketahuan saat render, dan lebih murah diperbaiki sebelum ada 12 form yang bergantung padanya |

### Konteks penting: pemisahan dari materi kerja

Artefak internal tempat kerja — report test, dashboard, tiket, repo pekerjaan — **tidak** ditautkan dari portofolio ini, dan nama perusahaan maupun klien tidak disebut di mana pun, termasuk di dokumen repo ini dan pesan commit.

Alasannya dua arah. Menautkan materi internal dari portofolio pribadi mengarahkan publik ke sana atas nama pemilik portofolio. Sebaliknya, membahas isi atau kelemahan materi itu secara terbuka di repo publik sama merusaknya. Keduanya dihindari dengan aturan yang sama: cukup sebutkan hasilnya, jangan sebutkan sumbernya.

Bukti kerja tetap dipakai dalam bentuk: narasi dan angka hasil yang dianonimkan (D5), serta suite test milik sendiri di repo ini (D6).

---

## 3. Yang eksplisit TIDAK dibangun

Dicatat agar tidak merayap masuk saat implementasi:

- Multi-user, peran, atau manajemen akun — hanya satu admin
- Signup publik (dimatikan di level Supabase, bukan disembunyikan di UI)
- Media library / pakai-ulang gambar lintas entri
- Blog, komentar, atau form kontak yang menyimpan pesan
- Live-trigger test run dari pengunjung anonim
- Ingest otomatis hasil CI ke Automation Lab (fase berikutnya, skema sudah siap)
- Bahasa ketiga
- Consent banner / cookie tracking (tidak diperlukan karena tanpa PII)

---

## 4. Arsitektur

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| Hosting | Vercel Hobby |
| Database | Supabase Postgres (2 proyek: produksi + staging) |
| Auth | Supabase Auth, email+password, satu akun |
| Storage | Supabase Storage |
| Validasi | Zod (dipakai bersama oleh form, API, dan test) |
| Styling | Tailwind CSS v4 (konfigurasi berbasis CSS lewat `@theme`, bukan `tailwind.config.ts`) dengan token warna/tipografi dari mockup |

Token desain dari mockup dipertahankan apa adanya: navy `#1E3A5F` sebagai primer, hijau `#1E8A5F` sebagai sinyal PASS, amber/merah bata untuk severity, latar netral `#F6F7F9`. Tipografi Space Grotesk (display), IBM Plex Sans (body), IBM Plex Mono (label data/status/test ID).

### Struktur route

```
app/
  [locale]/page.tsx              # landing — /id dan /en
  admin/login/page.tsx
  admin/(protected)/
    dashboard/                   # ringkasan analytics + status publikasi
    [collection]/page.tsx        # daftar entri (reorder, toggle publish)
    [collection]/[id]/page.tsx   # form edit, dirender form engine
  api/track/route.ts             # ingest analytics
  api/health/route.ts            # health-check, menyentuh DB
```

`[collection]` bersifat dinamis. Menambah koleksi konten baru tidak menambah satu pun file di `app/`.

### Mitigasi risiko free tier

Proyek Supabase free tier di-pause setelah sekitar seminggu tanpa aktivitas dan butuh restore manual. Untuk portofolio, itu berarti situs bisa mati persis saat rekruter membukanya.

Penutupnya: workflow CI harian (`nightly.yml`) menembak situs produksi, yang menembak database. Aktivitas itu mencegah pause. Cadangan: `/api/health` dipantau uptime monitor gratis sehingga pemilik yang mendapat notifikasi, bukan rekruter yang menemukan.

---

## 5. Model data

### Konvensi

```ts
type LocalizedText = { id: string; en: string }
type MediaRef      = { path: string; alt: LocalizedText; width: number; height: number }
```

Kolom bersama pada setiap tabel **koleksi**: `id` (uuid, pk), `sort_order` (int), `status` (`draft` | `published`), `created_at`, `updated_at`.

Tabel **singleton** (`site_settings`, `hero`, `about`) dikunci satu baris dengan `CHECK (id = 1)` dan tidak punya `sort_order` maupun `status`.

Tabel **log** (`analytics_events`) tidak mengikuti konvensi di atas — hanya `id` dan `created_at`, sifatnya append-only dan tidak pernah diedit.

### Tabel

**1. `site_settings`** (singleton)
`site_title` L, `meta_description` L, `og_image` M, `favicon` M, `availability_status` (`available` | `open` | `unavailable`), `contact_email`, `whatsapp_number`, `linkedin_url`, `github_url`, `resume_pdf` (path), `final_cta_headline` L, `final_cta_subtext` L, `copyright_text` L, `last_updated` (auto)

CTA akhir dan footer digabung ke sini karena isinya hanya empat field dan tidak pernah berdiri sendiri.

**2. `hero`** (singleton)
`full_name`, `role_title` L, `short_intro` L, `key_stats` JSONB `[{label: L, value}]`, `status_checks` JSONB `[{label: L, status, duration_label}]`, `cta_primary` `{label: L, link}`, `cta_secondary` `{label: L, link}`

`key_stats.value` bertipe **teks, bukan angka** — nilainya berbentuk "4+", "1.200+", "70%". Formatnya bagian dari konten dan diatur pemilik, bukan diformat ulang oleh kode.

**3. `tools`** (koleksi) — trust strip
`name`, `logo` M

**4. `about`** (singleton)
`profile_photo` M, `about_richtext` L, `highlight_badges` JSONB `[{text: L}]`

**5. `skill_categories`** (koleksi)
`category_name` L, `skills` JSONB `[{name, proficiency_percent, years}]`

**6. `case_studies`** (koleksi)
`test_code` (unik), `project_name` L, `role` L, `objective` L, `tools_used` JSONB `[string]`, `process_steps` JSONB `[{text: L}]`, `result_metrics` JSONB `[{label: L, value}]`, `evidence_links` JSONB `[{label: L, url}]`, `status_badge` (`completed` | `ongoing`)

**7. `lab_scenarios`** (koleksi)
`framework_name`, `scenario_title` L, `scenario_description` L, `tags` JSONB `[string]`, `steps` JSONB `[{label: L, duration_ms, status}]`, `result_summary` JSONB `{total, passed, failed, duration}`, `full_report_url`

Bentuk `steps` dan `result_summary` sengaja mengikuti bentuk keluaran report agar ingest otomatis kelak hanya perlu mengganti sumber data, bukan skema (D4).

**8. `experiences`** (koleksi)
`company` L, `role` L, `period_start`, `period_end` (nullable = sekarang), `location`, `responsibilities` JSONB `[{text: L}]`, `achievements` JSONB `[{text: L}]`

**9. `certifications`** (koleksi)
`name`, `issuer`, `year`, `credential_url`

**10. `education`** (koleksi)
`institution`, `degree` L, `year`

**11. `testimonials`** (koleksi)
`quote` L, `author_name`, `author_role` L, `author_company`, `photo` M

**12. `analytics_events`** (log)
`id`, `event_type` (`cta_click` | `cv_download` | `scroll_depth` | `evidence_click`), `event_label`, `locale`, `path`, `referrer_category`, `created_at`

`referrer_category` adalah enum tertutup — `direct` | `linkedin` | `github` | `search` | `other` — diturunkan dari host referrer lalu **referrer aslinya dibuang**. URL referrer penuh bisa mengandung informasi identifikasi, jadi tidak pernah disimpan.

Tidak menyimpan alamat IP, user-agent mentah, atau apa pun yang mengidentifikasi individu (D11).

*(L = `LocalizedText` JSONB, M = `MediaRef` JSONB)*

---

## 6. Admin: satu skema, empat konsumen

Definisi skema konten (`content-schemas/*.ts`) adalah satu-satunya sumber kebenaran, dikonsumsi oleh:

1. **Form engine** — merender field yang tepat
2. **Validator Zod** — memvalidasi di form dan di API
3. **Tipe TypeScript** — diturunkan, tidak ditulis ulang
4. **Fixture test** — data uji dibangkitkan dari skema

Konsekuensinya skema dan validasi tidak bisa berbeda pendapat: menambah field wajib langsung mengubah form, API, tipe, dan test sekaligus. Tidak ada celah drift antara validasi UI dan validasi backend.

### Komponen field (ditulis sekali, dipakai semua koleksi)

- `<LocalizedField>` — tab ID | EN
- `<RepeaterField>` — tambah/hapus/urut ulang, mendukung bersarang
- `<MediaField>` — upload, preview, alt text dwibahasa
- `<RichTextField>`

Menambah koleksi baru = menambah satu objek skema, bukan satu halaman form.

### Publish

Landing dirender React Server Components dan di-cache dengan tag. Menekan Publish memanggil `revalidateTag('content')` — pengunjung mendapat kecepatan halaman statis, tapi perubahan tampil dalam hitungan detik tanpa rebuild.

**Preview draft:** entri `draft` terlihat di landing lewat cookie preview yang hanya berlaku saat admin login. RLS memastikan ini bukan sekadar janji di kode aplikasi.

---

## 7. Keamanan

**Auth.** Supabase Auth, satu akun. Signup dimatikan di level Supabase. Middleware Next.js memeriksa session pada setiap route `admin/(protected)`.

**RLS sebagai lapis kedua.** Setiap tabel memakai Row Level Security:

- Baca publik hanya untuk baris `status = 'published'`
- Tulis hanya untuk user terautentikasi
- Draft tidak pernah bocor ke landing, bahkan jika ada bug di kode aplikasi

Seandainya middleware bocor, database tetap menolak. Klaim ini diverifikasi oleh test, bukan diasumsikan (lihat §9).

---

## 8. Landing: i18n, rendering, dan degradasi

### i18n berbasis path

`/id/...` dan `/en/...` adalah URL berbeda, keduanya terindeks, dilengkapi tag `hreflang` yang saling menunjuk. `/` mengalihkan berdasarkan `Accept-Language`, default Indonesia.

Toggle bahasa berbasis JavaScript pada satu URL hanya memberi satu halaman terindeks — pencarian berbahasa Inggris tidak akan menemukan situs ini. Path terpisah memberi dua halaman terindeks untuk dua pasar.

### Degradasi — dirancang dari skenario terburuk

Kegagalan paling mahal bukan bug fungsional, melainkan **rekruter membuka link dan mendapat halaman error.** Tidak ada kesempatan kedua. Semua aturan di bawah mengalir dari satu kalimat itu:

| Kondisi | Perilaku |
|---|---|
| DB lambat / tidak merespons | Sajikan cache terakhir yang berhasil |
| Cache kosong **dan** DB mati | Fallback minimal: nama, role, tombol kontak |
| Satu section gagal dimuat | Sembunyikan section itu saja, sisanya utuh |
| Gambar gagal dimuat | Placeholder + teks alt, layout tidak bergeser |
| `/api/health` gagal | Pemilik dapat notifikasi |

Di sisi admin berlaku sebaliknya — kegagalan harus berisik: error validasi tampil di field bersangkutan, penyimpanan atomik (tidak ada entri setengah tersimpan), peringatan saat meninggalkan form dengan perubahan belum disimpan.

---

## 9. Strategi test & CI

**Prinsip: test ditulis bersama fitur, bukan sebagai fase terpisah.** Suite yang ditulis belakangan hanya mengonfirmasi perilaku yang terlanjur ada, termasuk yang salah. Setiap fase punya definition-of-done yang mencakup test-nya. Yang ditaruh di Fase 4 hanya yang lintas-halaman dan memang baru bisa dijalankan setelah halaman lengkap.

| Lapisan | Alat | Yang dijaga |
|---|---|---|
| Unit | Vitest | Validasi Zod, resolver dwibahasa & fallback, urutan, bentuk event analytics |
| API & RLS | Playwright `APIRequestContext` | CRUD; klien anonim tidak bisa membaca draft; tidak bisa menulis; health endpoint |
| E2E | Playwright | 12 section terender, pindah bahasa, klik CTA terlacak, admin login → buat → publish → muncul di landing, repeater, upload media |
| Aksesibilitas | `@axe-core/playwright` | Landing (ID & EN) + layar admin utama |
| Visual regression | Screenshot Playwright | Regresi CSS antar section |
| Performa | Lighthouse CI | Budget LCP / CLS / TBT |
| Link | Nightly checker | Semua `evidence_links` & URL eksternal masih hidup |

Test RLS adalah satu-satunya yang membuktikan klaim keamanan §7 berlaku, bukan sekadar niat.

### Environment

**Tanpa Supabase lokal / Docker.** Mesin pengembangan tidak memiliki Docker dan sisa disk sangat terbatas (C: 18 GB, D: 11 GB per 2026-08-17); stack Supabase lokal menarik ~5-7 GB image di atas Docker Desktop sendiri. Risiko disk penuh lebih besar daripada manfaat determinisme lokal.

Sebagai gantinya, dua proyek free tier Supabase dipakai sebagai berikut:

| Proyek | Dipakai oleh |
|---|---|
| `portofolio-dev` | Pengembangan lokal, Vercel preview deploy, dan E2E/RLS di CI |
| `portofolio-prod` | Produksi |

Konsekuensi yang diterima sadar: pengembangan lokal dan E2E di CI berbagi satu database, sehingga bisa saling mengganggu jika berjalan bersamaan. Untuk proyek satu orang, peluang itu mendekati nol; jika suatu saat mengganggu, penyelesaiannya adalah membuat skema Postgres terpisah per environment di proyek yang sama, bukan menambah proyek.

**Determinisme test dijaga di lapisan lain:**

- Test unit (Vitest) tidak menyentuh database sama sekali
- Test RLS & E2E menjalankan `npm run db:reset` lebih dulu — script Node berbasis `pg` yang mengosongkan tabel lalu memuat ulang seed, sehingga keadaan awal selalu sama
- Migrasi dikelola sebagai file SQL di `supabase/migrations/` dan diterapkan ke proyek cloud lewat `supabase db push` (tidak butuh Docker). Jika perintah itu ternyata menuntut Docker pada versi CLI terpasang, fallback-nya menempelkan SQL yang sama lewat SQL Editor di dashboard Supabase — file migrasi tetap jadi sumber kebenaran.

Tidak ada binary eksternal yang dibutuhkan selain Node: `pg` diinstal sebagai dependensi npm, bukan `psql` sistem.

### Workflow

**`ci.yml`** — tiap push & PR: typecheck → lint → unit → API/RLS → E2E di preview deploy → a11y. Merah memblokir merge.

**`nightly.yml`** — harian: E2E terhadap produksi + link check + Lighthouse. Mengerjakan empat hal sekaligus: deteksi kerusakan produksi lebih dulu dari rekruter, verifikasi link hidup, jaga budget performa, dan jaga proyek Supabase tetap aktif.

**Badge footer** memakai badge SVG bawaan GitHub Actions dari repo publik ini, tertaut ke halaman daftar run. Tanpa API key, tanpa endpoint tambahan, dan statusnya dilayani GitHub sendiri sehingga tidak bisa dipalsukan dari sisi situs — itu yang membuatnya bisa diverifikasi siapa pun.

---

## 10. Fase pengerjaan

| Fase | Isi | Definition of done |
|---|---|---|
| **0** | Repo, Next.js, Supabase (lokal + 2 proyek cloud), Tailwind + token mockup, kerangka CI | Deploy kosong hidup, CI hijau |
| **1** | Migrasi 12 tabel + RLS + seed SQL + landing merender dari DB + i18n | Landing tampil lengkap dwibahasa dari database; belum ada admin; test unit + RLS + E2E landing hijau |
| | *(`analytics_events` ikut dimigrasi di Fase 1 agar skema utuh sejak awal, tapi baru diisi dan ditampilkan di Fase 3)* | |
| **2** | Auth + form engine + 4 komponen field + CRUD 12 koleksi + preview draft | Semua konten bisa diubah tanpa menyentuh kode; E2E admin CRUD hijau |
| **3** | Analytics + dashboard admin | Klik CTA, unduh CV, scroll depth, klik bukti tercatat & terlihat |
| **4** | a11y menyeluruh, visual regression, Lighthouse, link check, badge | Suite lengkap hijau, badge tayang |
| **5** | Konten asli, SEO (sitemap/robots/og/hreflang), domain, go-live | Live |

**Catatan ruang lingkup rencana.** Enam fase terlalu besar untuk satu rencana implementasi tunggal. Rencana dibuat **per fase**, dan fase berikutnya baru direncanakan setelah fase sebelumnya selesai — supaya apa yang dipelajari di Fase 1 (terutama koreksi skema, lihat D13) benar-benar masuk ke rencana Fase 2, bukan jadi rencana usang yang ditulis terlalu dini.

**Catatan urutan (D13).** Fase 1 mendahului Fase 2 dengan data dari seed SQL. Kesalahan skema baru ketahuan saat dirender, dan memperbaikinya sebelum ada dua belas form yang bergantung padanya jauh lebih murah. Efek sampingnya: di akhir Fase 1 sudah ada URL hidup yang bisa dikirim ke orang. Biaya yang diterima sadar: seed SQL sebagian terbuang setelah admin jadi — sebagian, karena seed itu langsung jadi fixture test.

---

## 11. Risiko terbuka

| Risiko | Penanganan |
|---|---|
| Batas free tier Supabase (storage, egress) berubah | Verifikasi angka aktual saat setup Fase 0; konten teks jauh di bawah batas, media yang perlu dipantau |
| Disk mesin dev tinggal ~11-18 GB | Docker sengaja dihindari (§9). Pantau ukuran `node_modules` + cache Playwright browser (~1 GB); arahkan cache Playwright ke drive E: bila perlu |
| `supabase db push` ternyata menuntut Docker | Fallback SQL Editor dashboard sudah didefinisikan di §9; file migrasi tetap sumber kebenaran sehingga tidak ada kehilangan |
| Cold start Vercel + Supabase pada kunjungan pertama | Diukur di Fase 4 lewat budget Lighthouse; jika melebihi, pertimbangkan pre-render lebih agresif |
| Visual regression rewel karena font web memuat asinkron | Tunggu `document.fonts.ready` sebelum screenshot; jika masih rewel, batasi ke section kunci |
| Konten asli (Fase 5) jadi penghambat sesungguhnya | Menulis studi kasus yang dianonimkan butuh waktu berpikir, bukan waktu ngoding — sisihkan jadwal terpisah |
