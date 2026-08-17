# Utang Terbuka

Hal yang sengaja ditunda beserta kapan harus dilunasi. Jangan menutup sebuah fase sebelum utang yang jatuh tempo di fase itu lunas.

## U-1 — Produksi masih menunjuk database dev  🔴 MEMBLOKIR FASE 1

**Keadaan:** environment `production` dan `preview` di Vercel sama-sama memakai kredensial proyek Supabase **dev** (`sgxepblrfqwbhhpmvaxm`), karena proyek `portofolio-prod` belum dibuat saat Fase 0 ditutup.

**Kenapa aman sekarang:** belum ada satu pun tabel maupun data.

**Kenapa berbahaya nanti:** begitu Fase 1 membuat tabel, situs produksi akan menyajikan data dev, dan E2E di CI akan menulis ke database yang sama dengan yang dibaca produksi.

**Cara melunasi — WAJIB sebelum migrasi pertama Fase 1 dijalankan:**
1. Buat proyek Supabase `portofolio-prod`, simpan database password-nya di password manager.
2. Ganti variabel `production` di Vercel ke kredensial proyek baru itu:
   ```bash
   vercel env rm NEXT_PUBLIC_SUPABASE_URL production
   vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   printf '%s' "<url-prod>" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
   printf '%s' "<key-prod>" | vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   ```
3. Deploy ulang produksi dan pastikan `/api/health` tetap `200`.
4. Biarkan `preview` tetap menunjuk dev — itu memang perilaku yang diinginkan.

## U-2 — Node lokal 20, CI & produksi 22  🟡 disarankan

Mesin dev memakai Node 20.19.6 sementara CI dan Vercel memakai Node 22, dan `@supabase/supabase-js` mendeklarasikan `engines.node >=22`. Semua hijau, tapi selisih runtime antara lokal dan produksi adalah sumber bug yang muncul belakangan. Naikkan mesin dev ke Node 22 LTS.
