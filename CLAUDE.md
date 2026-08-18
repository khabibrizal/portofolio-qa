@AGENTS.md

# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini.

## Apa ini

Landing page portofolio QA Engineer + admin CMS. **Seluruh konten halaman berasal dari database** dan diubah lewat halaman admin — tidak ada teks, angka, gambar, atau link yang di-hardcode di komponen.

Bahasa kode, komentar, judul test, dan pesan commit: **Bahasa Indonesia**.

## Dokumen yang mengikat

Baca sebelum mengubah apa pun yang bersifat arsitektural:

- **Spec:** `docs/superpowers/specs/2026-08-17-portofolio-qa-design.md` — 13 keputusan beserta alasannya, model data 12 tabel, strategi degradasi & test, pembagian 6 fase
- **Rencana fase berjalan:** `docs/superpowers/plans/` — satu rencana per fase

Kalau sebuah perubahan bertentangan dengan spec, ubah spec-nya dulu dan catat alasannya. Jangan biarkan kode dan spec berbeda pendapat diam-diam.

## Batas tanggung jawab yang tidak boleh dilanggar

| Aturan | Alasan |
|---|---|
| Warna & font **hanya** didefinisikan di `src/app/globals.css` (`@theme`) | Tidak ada hex yang tercecer di komponen; dikunci `tests/unit/design-tokens.test.ts` |
| `process.env` **hanya** dibaca di `src/lib/env.ts` | Variabel hilang gagal di satu tempat dengan pesan jelas, bukan `undefined` yang menjalar |
| Akses `NEXT_PUBLIC_*` harus bentuk literal `process.env.NAMA` | Next.js hanya menyulih nilai pada bentuk literal; mengoper objek `process.env` membuatnya `undefined` di klien |
| Teks dwibahasa disimpan `{ id, en }` (JSONB) | Lihat keputusan D7 di spec |
| Draft tidak boleh bocor ke landing | Dijaga RLS di database, bukan hanya filter di kode aplikasi |

## Testing

Dua runner, wilayah file terpisah — jangan sampai saling memakan:

- **Vitest** → `tests/unit/**/*.test.ts` — logika murni, tanpa browser, tanpa DB
- **Playwright** → `tests/e2e/**/*.spec.ts` dan `tests/api/**/*.spec.ts`

Playwright menembak bundel **produksi** (`npm run build && npm start`), bukan server dev. Setel `PLAYWRIGHT_BASE_URL` untuk menembak deploy yang sudah hidup tanpa build lokal.

Test ditulis **bersama** fitur, bukan setelahnya.

### Dua aturan yang lahir dari kesalahan nyata di proyek ini

**Pastikan test bisa gagal.** Sudah empat kali ditemukan test hijau yang tidak membuktikan apa pun, semuanya berpola sama: datanya tidak memungkinkan pemeriksaan itu gagal. Header `no-store` yang juga ada di 404 bawaan; tabel `analytics_events` kosong sehingga "anon tak bisa baca" dan "tabelnya memang kosong" tak terbedakan; satu-satunya `lab_scenarios` sehingga perpindahan tab tak teruji; seluruh `credential_url` kosong sehingga cabang tautan tak pernah jalan. Karena itu **seed wajib memuat variasi**, bukan hanya data yang bagus — termasuk baris `draft` di setiap koleksi dan kolom nullable yang terisi di sebagian baris saja.

Setelah menulis test yang langsung hijau, **rusak kodenya sengaja dan pastikan test itu merah**. Kalau tetap hijau, testnya belum menguji apa yang kamu kira.

**Presence pakai asersi yang retry, absence pakai baca sekali.** `await expect(locator).toContainText('x')` mengulang sampai muncul; `const t = await locator.innerText()` membaca sekali. Untuk membuktikan sesuatu **tidak** ada, retry justru menyesatkan — ia lulus seketika lalu kontennya bisa menyusul. Jadi absence diperiksa setelah halaman tenang, dengan satu kali baca.

### innerText menerapkan CSS, textContent tidak

Untuk memeriksa **ketiadaan** teks, pakai `textContent` dan bandingkan tanpa peduli huruf besar. `innerText` mengembalikan teks **hasil render**, yang sudah menerapkan `text-transform` — teks ber-`uppercase` di CSS akan terbaca `SEPERTI INI`, dan pencocokan persis meleset.

Ini pernah membuat test "tidak satu pun baris draft tampil" tak pernah bisa gagal untuk satu koleksi. Dibuktikan dengan melumpuhkan kedua lapis pengaman sekaligus: draft benar-benar terkirim ke halaman, dan test tetap hijau.

### Jangan mem-grep keluaran Vitest

Baris ringkasan bisa berbunyi `51 passed` padahal enam berkas gagal dijalankan (`Failed to start forks worker`, muncul saat mesin terbebani). Hanya **exit code** yang jujur. Mem-grep `Tests ` menyembunyikan pesan itu dan membuat kehilangan cakupan terlihat seperti keberhasilan.

## Environment

Tidak ada Supabase lokal dan tidak ada Docker (mesin dev kekurangan disk).

**Satu proyek Supabase dipakai untuk semuanya** — pengembangan lokal, E2E di CI, dan produksi (keputusan pemilik; lihat revisi §9 di spec). Kolom `status` yang berperan sebagai staging, dan RLS yang menjaga draft tak bocor.

Konsekuensinya yang harus selalu diingat:

- `npm run db:reset` menghapus isi portofolio yang **tayang**. Ia menolak jalan tanpa `--konfirmasi=<project-ref>`.
- Test yang menulis wajib memakai nama berawalan `ZZ-UJI-` dan membersihkannya di `afterAll` yang selalu berjalan.
- Playwright dikunci `workers: 1`: satu database dipakai bersama test yang menulis dan yang membaca, jadi paralelisme menghasilkan kegagalan yang tak ada hubungannya dengan kode — dan diukur di mesin ini, justru lebih lambat.

## Perintah

```bash
npm run dev         # server pengembangan
npm run build       # build produksi
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test:unit   # Vitest
npm run test:e2e    # Playwright (API + E2E)
npm test            # semua di atas, berurutan
```

## Jangan

- **Jangan menautkan artefak internal tempat kerja** — report test, dashboard, tiket, atau repo pekerjaan — dari mana pun di proyek ini. Bukti kerja dipakai sebagai angka yang dianonimkan saja.
- Jangan menyebut nama perusahaan tempat kerja, nama klien, atau ID tiket di mana pun, termasuk di dokumen dan pesan commit (keputusan D5 di spec).
- Jangan menghapus blok `<!-- BEGIN:nextjs-agent-rules -->` di `AGENTS.md` — `next dev` menulisnya ulang, dan menghapusnya hanya menghasilkan diff yang muncul terus.
