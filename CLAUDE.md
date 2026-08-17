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

## Environment

Tidak ada Supabase lokal dan tidak ada Docker (mesin dev kekurangan disk). Dua proyek Supabase cloud:

- `portofolio-dev` — dev lokal, Vercel preview, E2E di CI
- `portofolio-prod` — produksi

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
