# Fase 2b — Sebelas Koleksi Sisanya, Media, dan Penutupan U-4

> **Untuk pekerja agentik:** eksekusi task demi task, berurutan. Langkah memakai checkbox (`- [ ]`).

**Goal:** Seluruh dua belas koleksi bisa dikelola dari admin, termasuk unggah gambar dan berkas — sehingga janji "tidak ada konten yang di-hardcode" akhirnya berlaku untuk setiap field, bukan sebagian.

**Architecture:** Menambah koleksi tetap berarti menambah satu berkas skema; registry sudah jadi sumber tunggal sejak Fase 2a dan tidak boleh dilanggar. Yang benar-benar baru di fase ini hanya tiga jenis field dan satu bucket Storage. Sisanya mekanis.

**Tech Stack:** Next.js 16, `@supabase/ssr`, Supabase Storage, Zod 4, React 19, Tailwind v4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-17-portofolio-qa-design.md` §5, §6
**Fase sebelumnya:** Fase 2a selesai — auth, mesin form, `skill_categories` tuntas, pratinjau draft.

---

## Keputusan yang mengikat fase ini

**D18 — `RichTextField` DIBATALKAN.** Rencana Fase 2a mencantumkannya untuk fase ini. Setelah diperiksa, satu-satunya field "rich" di seluruh model data adalah `about_richtext`, dan `About.tsx` sudah memakainya sebagai **teks biasa** lewat `teks()` — mockup-nya pun paragraf biasa.

Membangun editor rich text berarti menambah editor, sanitizer, dan renderer HTML untuk satu field. Itu bukan cuma pekerjaan sia-sia: merender HTML dari database dengan `dangerouslySetInnerHTML` membuka kelas kerentanan XSS yang sekarang **tidak ada sama sekali**. Field ini memakai `terlokalisasi-panjang`.

**D19 — `MediaRef.path` menyimpan object path Storage, bukan URL penuh.** URL publik dibangun helper `urlMedia()`. Menyimpan URL penuh berarti menanam project ref Supabase ke dalam setiap baris konten; suatu saat pindah proyek berarti migrasi data, bukan mengganti satu konstanta.

**D20 — Tiga jenis field baru, bukan satu yang serba bisa:** `grup` (objek tunggal berfield tetap), `media` (gambar, punya `alt` dwibahasa + dimensi), `berkas` (PDF, tanpa alt maupun dimensi). Menyatukan gambar dan PDF ke satu jenis memaksa field yang tidak relevan muncul di form.

**D21 — Singleton dapat rute langsung ke form.** `site_settings`, `hero`, dan `about` hanya punya satu baris; menampilkan daftar berisi satu entri lalu memaksa satu klik lagi adalah kebisingan.

---

## Prasyarat

- [ ] **Bucket Storage dibuat lewat migrasi, bukan tangan.** Supabase mengizinkan pembuatan bucket lewat SQL (`storage.buckets`), jadi ia masuk repo dan bisa direproduksi — bukan langkah manual yang catatannya hilang.

## Ruang lingkup

**Termasuk:** jenis field `grup` / `media` / `berkas`, bucket Storage + kebijakannya, unggah lewat Server Action, helper `urlMedia()`, rute singleton, sebelas skema koleksi, penutupan U-4, dan pengujian `daftar-teks` serta `tanggal` yang sampai kini belum pernah teruji.

**Tidak termasuk (Fase 3):** analytics + dashboard-nya.
**Tidak termasuk (Fase 4):** a11y menyeluruh, visual regression, Lighthouse, link checker.
**Tidak termasuk (Fase 5):** konten asli, melepas `noindex` (U-5).

## Definition of done

1. Dua belas koleksi bisa diedit dari admin; nol nama koleksi tertulis keras di komponen
2. Unggah gambar bekerja, dan gambarnya **benar-benar dimuat** di landing (HTTP 200) — bukan sekadar elemen `<img>` ada
3. Unggah PDF bekerja, dan tombol Unduh CV menunjuk berkas yang benar-benar ada
4. `daftar-teks`, `tanggal`, `grup`, `media`, `berkas` masing-masing punya test yang **terbukti bisa gagal**
5. Draft tetap tidak bocor ke landing untuk **setiap** koleksi
6. U-4 lunas
7. `npm test` hijau, CI hijau, build tetap `● /id` dan `● /en`

---

## Task 1: Jenis field `grup`

Dibutuhkan `hero.cta_primary`, `hero.cta_secondary`, dan `lab_scenarios.result_summary` — objek tunggal berfield tetap, bukan array.

**Files:** `src/lib/admin/skema/tipe.ts`, `ke-zod.ts`, `src/components/admin/field/FieldGrup.tsx`, `RenderField.tsx`, `tests/unit/skema-ke-zod.test.ts`, `tests/komponen/FieldGrup.test.tsx`

- [ ] Tambah `'grup'` ke `JenisField`, memakai `anak` seperti `repeater` tapi untuk satu objek.
- [ ] Validator: path error wajib menyebut nama field anaknya (`['cta_primary', 'link']`) — tanpa itu kesalahan di dalam grup muncul tanpa alamat.
- [ ] `FieldGrup` merender `anak` lewat `RenderField`, sama seperti `FieldRepeater` — jangan duplikasi switch.
- [ ] **Uji daya gigit:** longgarkan validator grup sampai ia tidak memeriksa anaknya; test path error **harus gagal**.
- [ ] Commit — `feat(admin): jenis field grup untuk objek tunggal`

## Task 2: Storage, `media`, dan `berkas`

**Files:** `supabase/migrations/*_storage.sql`, `src/lib/media.ts`, `src/components/admin/field/FieldMedia.tsx`, `FieldBerkas.tsx`, `scripts/audit-rls.ts`, komponen konsumen media

- [ ] **Migrasi:** bucket `media` (publik untuk dibaca), kebijakan `storage.objects`: **baca oleh siapa pun, tulis/hapus hanya `public.adalah_pemilik()`**. Gerbangnya sama dengan tabel konten — jangan pakai `to authenticated` saja, itu kesalahan yang sudah pernah terjadi dan sudah pernah dieksploitasi di fase ini.
- [ ] `src/lib/media.ts` — `urlMedia(path)` membangun URL publik dari object path (D19). Dipakai landing dan pratinjau.
- [ ] **Perbarui konsumen** yang kini memakai `path` sebagai `src` langsung: `About.tsx`, `Testimonials.tsx`, dan metadata `og_image` / `favicon`.
- [ ] **Verifikasi `next/image` menerima URL Storage.** `unoptimized` mungkin masih tunduk pada `images.remotePatterns`. Jangan menebak — coba, dan bila perlu tambahkan pola untuk host Supabase. Laporkan hasilnya.
- [ ] `FieldMedia`: unggah, pratayang, `alt` dwibahasa **wajib** (aksesibilitas bukan opsional, dan Fase 4 akan mengujinya), dimensi diambil dari berkasnya — bukan diisi tangan.
- [ ] `FieldBerkas`: unggah PDF, tampilkan nama + ukuran, tanpa alt maupun dimensi.
- [ ] **Uji daya gigit:** ubah kebijakan Storage jadi `to authenticated` tanpa `adalah_pemilik()`; audit **harus gagal**. Tambahkan pemeriksaan Storage ke `scripts/audit-rls.ts`.
- [ ] Commit — `feat(admin): Storage + jenis field media dan berkas`

## Task 3: Rute singleton + tiga skema singleton

**Files:** `src/lib/admin/skema/{site-settings,hero,about}.ts`, rute admin, `tests/e2e/admin-singleton.spec.ts`

- [ ] Rute: koleksi ber-`singleton: true` langsung membuka form, tanpa daftar. Navigasi menyesuaikan sendiri dari registry.
- [ ] `site_settings` memakai `pilihan` (availability_status), `media` (og_image, favicon), `berkas` (resume_pdf), `url`, dan `terlokalisasi`.
- [ ] `hero` memakai `grup` (dua CTA) dan `repeater` (key_stats, status_checks).
- [ ] `about` memakai `media`, `terlokalisasi-panjang`, `repeater`.
- [ ] E2E: ubah satu field di tiap singleton, simpan, dan **landing ikut berubah**. Pulihkan nilainya di `afterAll` — ini database produksi.
- [ ] Commit — `feat(admin): rute singleton + skema site_settings, hero, about`

## Task 4: Empat koleksi sederhana

`tools`, `certifications`, `education`, `testimonials`.

- [ ] `tools` memperkenalkan `media` pada koleksi biasa (logo).
- [ ] `certifications` dan `education` memakai `angka` (tahun) dan `url`.
- [ ] `testimonials` memakai `media` (photo) — dan inilah yang **melunasi U-4** bersama Task 6.
- [ ] E2E per koleksi: buat draft → tak tampil di landing → terbitkan → tampil → hapus. Nama uji berawalan `ZZ-UJI-`, dibersihkan di `afterAll` yang selalu jalan.
- [ ] Commit — `feat(admin): skema tools, certifications, education, testimonials`

## Task 5: Tiga koleksi kompleks

- [ ] `case_studies`: `daftar-teks` (tools_used) + tiga repeater (process_steps, result_metrics, evidence_links) + `pilihan` (status_badge) + `teks` unik (test_code).
- [ ] **`test_code` wajib unik** — pelanggaran harus muncul sebagai pesan di field itu, bukan sebagai layar error dari pelanggaran constraint database.
- [ ] `lab_scenarios`: `daftar-teks` (tags), repeater `steps`, `grup` `result_summary`, `url` `full_report_url`.
- [ ] `experiences`: `tanggal` (`period_start` wajib, `period_end` boleh kosong = masih berjalan) + dua repeater.
- [ ] **`period_end` sebelum `period_start` harus ditolak** — constraint-nya sudah ada di database sejak Fase 1a; form harus menangkapnya lebih dulu dengan pesan yang jelas, bukan membiarkan database melempar.
- [ ] Commit — `feat(admin): skema case_studies, lab_scenarios, experiences`

## Task 6: Penutupan U-4

- [ ] Unggah satu gambar sungguhan untuk `about.profile_photo` dan satu untuk sebuah `testimonials.photo`, **lewat admin** — bukan lewat SQL.
- [ ] Perbarui `supabase/seed.sql` agar keduanya terisi, supaya `db:reset` tidak mengosongkannya lagi.
- [ ] **E2E: gambarnya benar-benar dimuat** — periksa `response.status() === 200` untuk permintaan gambarnya, bukan hanya keberadaan elemen `<img>`. Cabang yang selama ini tidur akhirnya dieksekusi.
- [ ] Tandai U-4 lunas di `UTANG-TERBUKA.md`.
- [ ] Commit — `feat(media): tutup U-4 dengan gambar sungguhan + bukti termuat`

## Task 7: Verifikasi menyeluruh

- [ ] Setiap koleksi punya minimal satu baris draft di seed, dan `draft-tidak-tampil.spec.ts` memeriksa penandanya — **dengan `textContent` tanpa peduli huruf besar**, sesuai pelajaran Fase 2a.
- [ ] `npm run db:audit-rls` hijau, termasuk pemeriksaan Storage yang baru.
- [ ] `npm run db:reset -- --konfirmasi=<ref>` dua kali berturut-turut menghasilkan keadaan identik.
- [ ] Database bersih dari `ZZ-UJI-`. Buktikan dengan query.
- [ ] Commit — `test: verifikasi menyeluruh dua belas koleksi`

---

## Verifikasi akhir Fase 2b

- [ ] Dua belas koleksi bisa diedit dari admin
- [ ] Gambar dan PDF terunggah dan **terbukti termuat** di landing
- [ ] Lima jenis field baru/belum teruji masing-masing terbukti bisa gagal
- [ ] Draft tidak bocor untuk koleksi mana pun
- [ ] U-4 lunas
- [ ] `npm test` hijau, CI hijau, build `● /id` dan `● /en`
- [ ] Nol nama koleksi tertulis keras di komponen
