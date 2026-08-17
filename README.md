# Portofolio QA Engineer

[![CI](https://github.com/khabibrizal/portofolio-qa/actions/workflows/ci.yml/badge.svg)](https://github.com/khabibrizal/portofolio-qa/actions/workflows/ci.yml)

Landing page portofolio QA Engineer dengan admin CMS. Seluruh konten halaman berasal dari database dan diubah lewat halaman admin — tidak ada yang di-hardcode.

- **Live:** https://portofolio-qa-gray.vercel.app
- **Desain & keputusan:** [`docs/superpowers/specs/2026-08-17-portofolio-qa-design.md`](docs/superpowers/specs/2026-08-17-portofolio-qa-design.md)
- **Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Supabase, Vercel
- **Test:** Vitest (unit) + Playwright (API & E2E), dijalankan di GitHub Actions tiap push

## Menjalankan secara lokal

Butuh Node 22 atau lebih baru.

```bash
npm install
cp .env.example .env.local   # isi dengan kredensial proyek Supabase dev
npm run dev
```

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run typecheck` | Periksa tipe TypeScript |
| `npm run lint` | ESLint |
| `npm run test:unit` | Test unit (Vitest) |
| `npm run test:e2e` | Test API & E2E (Playwright) |
| `npm test` | Semua di atas, berurutan |
