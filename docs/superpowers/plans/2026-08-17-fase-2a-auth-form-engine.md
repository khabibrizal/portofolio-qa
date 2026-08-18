# Fase 2a — Auth, Form Engine, dan Satu Koleksi Tuntas

> **Untuk pekerja agentik:** eksekusi task demi task, berurutan. Langkah memakai checkbox (`- [ ]`).

**Goal:** Admin yang terlindungi login, dengan mesin form yang digerakkan skema, dibuktikan tuntas pada satu koleksi tersulit — dari daftar entri sampai tersimpan, terbit, dan berubah di landing.

**Architecture:** Satu definisi skema TypeScript per koleksi menggerakkan empat konsumen sekaligus: form yang ter-render, validator Zod, tipe, dan fixture test. Penulisan memakai Server Action dengan klien Supabase berbasis cookie, sehingga sesi login menjadikan peran `authenticated` — dan kebijakan RLS yang sudah ada di Fase 1a-lah yang mengizinkan tulisan itu. Tidak ada secret key di mana pun.

**Tech Stack:** Next.js 16 (Server Actions + middleware), `@supabase/ssr`, Zod 4, React 19, Tailwind v4, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-17-portofolio-qa-design.md` §6, §7
**Fase sebelumnya:** Fase 1a (skema + RLS) dan 1b (landing) — selesai, situs live.

---

## Keputusan yang mengikat fase ini

**D14 — Preview draft memakai rute terpisah, bukan cookie di landing.** Spec §6 semula menaruh preview di landing lewat cookie. Membaca cookie membuat halaman dinamis, dan itu persis yang mematikan ISR — masalah yang sudah ditemukan dan diperbaiki di Fase 1b. Preview karena itu hidup di `/admin/pratinjau/[locale]`, dirender dinamis, dan menampilkan penanda visual pada entri yang masih draft. Landing tetap murni statis.

**D15 — Antarmuka admin berbahasa Indonesia saja.** Yang dwibahasa adalah kontennya, bukan panel pengelolanya. Panel ini dipakai satu orang; menerjemahkannya menambah pekerjaan tanpa menambah pembaca.

**D16 — Tulisan lewat Server Action, bukan route handler.** Server Action berjalan di server dengan sesi pengguna, sehingga RLS berlaku apa adanya tanpa perlu secret key. Ini juga yang membuat klaim keamanan §7 tetap berlaku di jalur tulis, bukan cuma di jalur baca.

**D17 — Koleksi pembuktian adalah `skill_categories`.** Ia menggabungkan dua bentuk tersulit sekaligus: teks dwibahasa dan repeater bersarang (`skills[]`). Membuktikan mesin form pada bentuk termudah tidak membuktikan apa pun.

---

## Prasyarat — langkah manual yang hanya bisa dilakukan pemilik

- [ ] **Matikan pendaftaran publik.** Supabase Dashboard → Authentication → Sign In / Providers → Email → matikan **Allow new users to sign up**. Ini dimatikan di level proyek, bukan disembunyikan di UI, sesuai spec §7.
- [ ] **Buat satu akun admin.** Authentication → Users → **Add user** → Create new user, isi email dan password, centang **Auto Confirm User**. Simpan kredensialnya di password manager.
- [ ] **Kirimkan email akun itu** (bukan passwordnya) supaya bisa dipakai di test E2E lewat GitHub Secret.

## Ruang lingkup

**Termasuk:** middleware sesi, halaman login/logout, kerangka admin, registry skema, mesin form, `LocalizedField`, `RepeaterField`, CRUD tuntas untuk `skill_categories`, penerbitan + revalidasi landing, rute pratinjau, test unit + E2E.

**Tidak termasuk (Fase 2b):** sebelas koleksi lainnya, `MediaField` + Supabase Storage, `RichTextField`.
**Tidak termasuk (Fase 3):** dashboard analytics.

## Definition of done

1. `/admin` tanpa sesi mengalihkan ke `/admin/login` — dibuktikan E2E
2. Login berhasil membawa ke daftar koleksi; logout mengembalikan ke login
3. `skill_categories` bisa dibuat, diubah, diurutkan, dan diterbitkan lewat form
4. Menyimpan entri baru sebagai `draft` **tidak** mengubah landing; menerbitkannya **mengubah** landing tanpa deploy ulang — dibuktikan E2E
5. Validasi gagal menampilkan error di field yang bersangkutan dan **tidak** menulis apa pun
6. `/admin/pratinjau/id` menampilkan entri draft dengan penanda; landing tetap tidak
7. `npm test` hijau, CI hijau, dan build tetap melaporkan `● /id` dan `● /en`

---

## Struktur file

```
src/
  middleware.ts                       # penyegar sesi + penjaga rute admin
  lib/
    admin/
      skema/
        tipe.ts                       # bentuk definisi field
        ke-zod.ts                     # turunkan validator dari definisi
        skill-categories.ts           # definisi koleksi pembuktian
        index.ts                      # registry: slug -> definisi
      aksi.ts                         # Server Action simpan/terbit/hapus/urut
  app/
    admin/
      login/page.tsx
      (terlindungi)/
        layout.tsx                    # kerangka + navigasi koleksi + logout
        page.tsx                      # daftar koleksi
        [koleksi]/page.tsx            # daftar entri
        [koleksi]/[id]/page.tsx       # form edit
        pratinjau/[locale]/page.tsx   # landing versi draft-terlihat
  components/
    admin/
      FormSkema.tsx                   # mesin form
      field/
        FieldTeks.tsx
        FieldTerlokalisasi.tsx
        FieldRepeater.tsx
        FieldPilihan.tsx
        FieldAngka.tsx
tests/
  unit/skema-ke-zod.test.ts
  e2e/admin-auth.spec.ts
  e2e/admin-crud.spec.ts
  e2e/admin-terbit.spec.ts
```

**Batas tanggung jawab.** `lib/admin/skema/` hanya mendeskripsikan bentuk data — ia tidak tahu React maupun Supabase. `FormSkema.tsx` hanya tahu cara merender deskripsi itu — ia tidak tahu koleksi apa pun secara khusus. `aksi.ts` satu-satunya yang menulis ke database. Tiga batas ini yang membuat menambah koleksi di Fase 2b tidak menyentuh satu pun berkas komponen.

---

## Task 1: Middleware sesi dan penjaga rute

**Files:** `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `tests/e2e/admin-auth.spec.ts`

- [ ] **Step 1: Tulis test yang gagal**

`tests/e2e/admin-auth.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('Penjaga rute admin', () => {
  for (const rute of ['/admin', '/admin/skill-categories', '/admin/pratinjau/id']) {
    test(`${rute} tanpa sesi dialihkan ke halaman login`, async ({ page }) => {
      await page.goto(rute)
      await expect(page).toHaveURL(/\/admin\/login/)
    })
  }

  test('halaman login bisa diakses tanpa sesi', async ({ page }) => {
    const res = await page.goto('/admin/login')
    expect(res?.status()).toBe(200)
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Kata sandi')).toBeVisible()
  })

  test('tidak ada halaman pendaftaran publik', async ({ page }) => {
    for (const rute of ['/admin/daftar', '/admin/signup', '/admin/register']) {
      const res = await page.goto(rute)
      expect(res?.status(), `${rute} seharusnya tidak ada`).toBe(404)
    }
  })
})
```

Test terakhir menjaga janji spec §7: pendaftaran bukan sekadar disembunyikan dari menu, ia memang tidak ada.

- [ ] **Step 2:** jalankan → GAGAL (rute admin belum ada).

- [ ] **Step 3: Buat `src/lib/supabase/middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

/**
 * Menyegarkan sesi Supabase pada setiap permintaan ke rute admin.
 *
 * Tanpa ini, token kedaluwarsa di tengah pemakaian dan pengguna terlempar
 * ke login saat sedang mengisi form — kehilangan yang belum tersimpan.
 */
export async function perbaruiSesi(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // getUser() memverifikasi token ke server Supabase. getSession() hanya
  // membaca cookie dan bisa dipalsukan — jangan dipakai untuk otorisasi.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
```

Komentar terakhir itu bukan hiasan: memakai `getSession()` untuk keputusan otorisasi adalah kesalahan keamanan yang umum, karena isinya berasal dari cookie yang dikirim klien.

- [ ] **Step 4: Buat `src/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { perbaruiSesi } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user } = await perbaruiSesi(request)

  const jalur = request.nextUrl.pathname
  const halamanLogin = jalur === '/admin/login'

  if (!user && !halamanLogin) {
    const tujuan = request.nextUrl.clone()
    tujuan.pathname = '/admin/login'
    return NextResponse.redirect(tujuan)
  }

  if (user && halamanLogin) {
    const tujuan = request.nextUrl.clone()
    tujuan.pathname = '/admin'
    return NextResponse.redirect(tujuan)
  }

  return response
}

// Hanya rute admin yang dijaga. Landing sengaja TIDAK masuk matcher:
// menyentuhnya dengan middleware yang membaca cookie akan membuatnya
// dinamis dan mematikan ISR — pelajaran dari Fase 1b.
export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 5:** buat `src/app/admin/login/page.tsx` sementara berisi form kosong dengan label `Email` dan `Kata sandi`, cukup untuk menghijaukan test. Isi sesungguhnya di Task 2.

- [ ] **Step 6:** `npm run build` → **periksa `/id` dan `/en` tetap `●`**. Lalu `npm run test:e2e`.

- [ ] **Step 7: Commit** — `feat(admin): middleware sesi + penjaga rute`

---

## Task 2: Login dan logout

**Files:** `src/app/admin/login/page.tsx`, `src/lib/admin/aksi.ts`

- [ ] **Step 1: Tambah test**

```ts
test('login dengan kredensial salah menampilkan pesan, bukan halaman error', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill('bukan@ada.test')
  await page.getByLabel('Kata sandi').fill('salah-sekali')
  await page.getByRole('button', { name: 'Masuk' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/login/)
})
```

Test dengan kredensial **benar** memerlukan akun asli; taruh di `admin-crud.spec.ts` (Task 6) dan baca dari environment `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Bila keduanya tidak ada, `test.skip` dengan pesan jelas — jangan gagal, dan jangan pula diam-diam lulus.

- [ ] **Step 2:** implementasikan Server Action `masuk` dan `keluar` di `src/lib/admin/aksi.ts`, dan form login yang memakainya. Pesan kesalahan tampil di elemen ber-`role="alert"`, tidak pernah membocorkan apakah email-nya terdaftar.

- [ ] **Step 3:** simpan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` sebagai GitHub Secret, tambahkan ke blok `env` di `ci.yml`.

- [ ] **Step 4:** verifikasi lengkap, commit — `feat(admin): login dan logout`

---

## Task 3: Registry skema dan turunan Zod

Ini inti fase 2. Satu definisi, empat konsumen.

**Files:** `src/lib/admin/skema/tipe.ts`, `ke-zod.ts`, `skill-categories.ts`, `index.ts`, `tests/unit/skema-ke-zod.test.ts`

- [ ] **Step 1: Tulis `tipe.ts`**

```ts
export type JenisField =
  | 'teks'
  | 'teks-panjang'
  | 'terlokalisasi'
  | 'terlokalisasi-panjang'
  | 'angka'
  | 'tanggal'
  | 'pilihan'
  | 'url'
  | 'daftar-teks'
  | 'repeater'

export type DefinisiField = {
  nama: string
  label: string
  jenis: JenisField
  wajib?: boolean
  petunjuk?: string
  /** Hanya untuk 'pilihan'. */
  opsi?: { nilai: string; label: string }[]
  /** Hanya untuk 'repeater' — bentuk tiap barisnya. */
  anak?: DefinisiField[]
  /** Hanya untuk 'angka'. */
  min?: number
  max?: number
}

export type DefinisiKoleksi = {
  slug: string
  tabel: string
  label: string
  labelTunggal: string
  /** Kolom yang dipakai sebagai judul baris di daftar entri. */
  kolomJudul: string
  singleton?: boolean
  field: DefinisiField[]
}
```

- [ ] **Step 2: Tulis test yang gagal** — `tests/unit/skema-ke-zod.test.ts`

Uji minimal ini, semuanya dengan data konkret:

- field `terlokalisasi` wajib menolak `{ id: '', en: '' }` dan menerima `{ id: 'a', en: 'b' }`
- field `terlokalisasi` wajib menolak objek yang kehilangan kunci `en`
- field `angka` menghormati `min`/`max`
- field `pilihan` menolak nilai di luar `opsi`
- field `url` menolak string yang bukan URL, tapi menerima kosong bila tidak wajib
- `repeater` memvalidasi **setiap baris**, dan pesan errornya menyebut indeks barisnya
- field opsional yang kosong tidak memicu error

Assertion indeks baris itu penting: tanpa itu, kesalahan di baris kelima sebuah repeater muncul sebagai pesan tanpa alamat, dan pengisi form harus menebak baris mana yang salah.

- [ ] **Step 3:** implementasikan `ke-zod.ts` sampai hijau.

- [ ] **Step 4: Tulis `skill-categories.ts`**

```ts
import type { DefinisiKoleksi } from './tipe'

export const skillCategories: DefinisiKoleksi = {
  slug: 'skill-categories',
  tabel: 'skill_categories',
  label: 'Kategori Keahlian',
  labelTunggal: 'Kategori',
  kolomJudul: 'category_name',
  field: [
    {
      nama: 'category_name',
      label: 'Nama Kategori',
      jenis: 'terlokalisasi',
      wajib: true,
    },
    {
      nama: 'skills',
      label: 'Keahlian',
      jenis: 'repeater',
      petunjuk: 'Urutannya menentukan urutan tampil di halaman.',
      anak: [
        { nama: 'name', label: 'Nama', jenis: 'teks', wajib: true },
        {
          nama: 'proficiency_percent',
          label: 'Penguasaan (%)',
          jenis: 'angka',
          wajib: true,
          min: 0,
          max: 100,
        },
        { nama: 'years', label: 'Tahun Pengalaman', jenis: 'angka', min: 0, max: 60 },
      ],
    },
  ],
}
```

- [ ] **Step 5:** `index.ts` mengekspor registry `Record<string, DefinisiKoleksi>` dan fungsi pencari yang melempar bila slug tak dikenal.

- [ ] **Step 6: Commit** — `feat(admin): registry skema + turunan validator Zod`

---

## Task 4: Mesin form dan komponen field

**Files:** `src/components/admin/FormSkema.tsx`, `src/components/admin/field/*.tsx`

- [ ] **Step 1:** `FieldTeks`, `FieldAngka`, `FieldPilihan` — sederhana, terkendali, menampilkan error per field.

- [ ] **Step 2:** `FieldTerlokalisasi` — dua tab (ID | EN) di atas satu input. Tab yang **belum terisi diberi penanda visual**, supaya kelalaian mengisi satu bahasa terlihat tanpa harus mengeklik tabnya.

- [ ] **Step 3:** `FieldRepeater` — tambah baris, hapus baris, naik/turun. Mendukung bersarang dengan merender `FormSkema` untuk `anak`. Setiap baris menampilkan errornya sendiri.

- [ ] **Step 4:** `FormSkema` — menerima `DefinisiKoleksi` + nilai awal, merender field sesuai jenisnya, memvalidasi dengan Zod turunan, dan memanggil Server Action saat disimpan.

- [ ] **Step 5:** peringatan saat meninggalkan form dengan perubahan belum tersimpan (`beforeunload`), sesuai spec §8 — di sisi admin kegagalan harus berisik.

- [ ] **Step 6: Commit** — `feat(admin): mesin form berbasis skema + empat komponen field`

---

## Task 5: Kerangka admin dan daftar entri

**Files:** `src/app/admin/(terlindungi)/layout.tsx`, `page.tsx`, `[koleksi]/page.tsx`

- [ ] Kerangka: navigasi koleksi dari registry (bukan daftar keras), tombol keluar, dan penanda akun yang sedang masuk.
- [ ] Daftar entri: judul dari `kolomJudul`, lencana status draft/terbit, urutan, tombol ubah, tombol tambah.
- [ ] Slug tak dikenal di URL harus menghasilkan **404, bukan 500**. `cariDefinisiKoleksi()` sengaja melempar karena slug tak terdaftar selalu berarti bug pemanggil — tapi di rute `[koleksi]`, slug datang dari alamat yang diketik orang. Rute wajib memeriksa keanggotaan registry lebih dulu lalu memanggil `notFound()`, bukan membiarkan lemparan itu jadi layar error.
- [ ] Commit — `feat(admin): kerangka admin dan daftar entri`

---

## Task 6: CRUD tuntas untuk `skill_categories`

**Files:** `src/lib/admin/aksi.ts`, `src/app/admin/(terlindungi)/[koleksi]/[id]/page.tsx`, `tests/e2e/admin-crud.spec.ts`

- [ ] **Step 1:** Server Action `simpan`, `terbitkan`, `jadikanDraft`, `hapus`, `urutkan`. Semuanya memvalidasi ulang dengan Zod **di server** — validasi klien adalah kenyamanan, bukan pengaman.

- [ ] **Step 2: Test E2E siklus penuh**, dilewati bersih bila `ADMIN_EMAIL`/`ADMIN_PASSWORD` tidak tersedia:

1. Masuk
2. Buat kategori baru dengan dua keahlian di repeater, simpan sebagai draft
3. Entri muncul di daftar dengan lencana draft
4. **Landing `/id` belum menampilkannya**
5. Terbitkan
6. **Landing `/id` menampilkannya tanpa deploy ulang**
7. Ubah nama, simpan, landing ikut berubah
8. Hapus, landing tidak lagi menampilkannya

Langkah 4 dan 6 adalah inti seluruh fase ini: mereka membuktikan `status` benar-benar mengendalikan apa yang publik lihat, dan penerbitan benar-benar merambat.

**Bersihkan entri uji di akhir**, apa pun hasilnya — test yang meninggalkan sampah di database produksi akan menumpuk sampai terlihat di portofolio.

- [ ] **Step 3:** setelah menyimpan atau menerbitkan, panggil `revalidatePath('/id')` dan `revalidatePath('/en')`. Tanpa ini landing tetap menyajikan render lama sampai 300 detik berlalu.

- [ ] **Step 4: Uji daya gigit.** Hapus panggilan `revalidatePath`, jalankan test siklus penuh, dan pastikan langkah 6 **GAGAL**. Kalau tetap hijau, testnya tidak membuktikan perambatan. Pulihkan lalu jalankan lagi.

- [ ] **Step 5: Commit** — `feat(admin): CRUD dan penerbitan skill_categories`

---

## Task 7: Rute pratinjau

**Files:** `src/app/admin/(terlindungi)/pratinjau/[locale]/page.tsx`

- [ ] Merender komposisi section yang sama dengan landing, tetapi mengambil data **tanpa filter status**, dan menandai setiap entri draft secara visual.
- [ ] Rute ini dinamis dan berada di bawah penjaga admin — landing tetap `●`.
- [ ] E2E: entri draft yang sama tampil di `/admin/pratinjau/id` dan **tidak** tampil di `/id`.
- [ ] Commit — `feat(admin): pratinjau draft di rute terpisah`

---

## Verifikasi akhir Fase 2a

- [ ] `/admin` tanpa sesi selalu berujung di `/admin/login`; tidak ada rute pendaftaran
- [ ] Siklus buat → draft → terbit → ubah → hapus bekerja, dan landing mengikuti
- [ ] Menghapus `revalidatePath` membuat test gagal (dibuktikan, bukan diasumsikan)
- [ ] Validasi gagal tidak menulis apa pun ke database
- [ ] `npm test` hijau, CI hijau, build tetap `● /id` dan `● /en`
- [ ] Tidak ada entri uji tertinggal di database
