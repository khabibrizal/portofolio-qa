import { describe, expect, it } from 'vitest'
import { bacaNilai, nilaiAwalField, nilaiAwalKoleksi, tulisNilai } from '@/lib/admin/nilai'
import { skillCategories } from '@/lib/admin/skema/skill-categories'
import { buatSkemaKoleksi, petaErrorDariZod } from '@/lib/admin/skema/ke-zod'
import type { DefinisiField, DefinisiKoleksi } from '@/lib/admin/skema/tipe'

describe('tulisNilai', () => {
  it('menulis field top-level tanpa mengubah field lain', () => {
    const awal = { category_name: { id: 'a', en: 'b' }, skills: [] }
    const hasil = tulisNilai(awal, ['skills'], [{ name: 'React' }]) as typeof awal

    expect(hasil.skills).toEqual([{ name: 'React' }])
    expect(hasil.category_name).toEqual({ id: 'a', en: 'b' })
    // Imutabel: objek asal tidak disentuh.
    expect(awal.skills).toEqual([])
  })

  it('menulis satu sisi bahasa tanpa menghapus sisi yang lain', () => {
    const awal = { category_name: { id: 'Frontend', en: 'Frontend' } }
    const hasil = tulisNilai(awal, ['category_name', 'en'], 'Front-end Developer') as typeof awal

    expect(hasil.category_name).toEqual({ id: 'Frontend', en: 'Front-end Developer' })
  })

  it('menulis ke indeks baris tertentu di dalam array bersarang', () => {
    const awal = {
      skills: [
        { name: 'React', years: 3 },
        { name: 'Vue', years: 1 },
        { name: 'Svelte', years: 1 },
      ],
    }
    const hasil = tulisNilai(awal, ['skills', 1, 'name'], 'Vue.js') as typeof awal

    expect(hasil.skills[0]).toEqual({ name: 'React', years: 3 })
    expect(hasil.skills[1]).toEqual({ name: 'Vue.js', years: 1 })
    expect(hasil.skills[2]).toEqual({ name: 'Svelte', years: 1 })
  })

  it('membuat objek/array baru di sepanjang jalur kalau belum ada', () => {
    const hasil = tulisNilai(undefined, ['skills', 0, 'name'], 'React') as {
      skills: { name: string }[]
    }
    expect(hasil.skills[0]).toEqual({ name: 'React' })
  })

  it('jalur kosong mengganti seluruh nilai', () => {
    expect(tulisNilai({ a: 1 }, [], { b: 2 })).toEqual({ b: 2 })
  })
})

describe('bacaNilai', () => {
  it('membaca nilai bersarang lewat jalur', () => {
    const nilai = { skills: [{ name: 'React' }, { name: 'Vue' }] }
    expect(bacaNilai(nilai, ['skills', 1, 'name'])).toBe('Vue')
  })

  it('mengembalikan undefined kalau jalur tidak ada, tidak melempar', () => {
    expect(bacaNilai({}, ['skills', 0, 'name'])).toBeUndefined()
    expect(bacaNilai(undefined, ['a', 'b'])).toBeUndefined()
  })
})

describe('nilaiAwalKoleksi', () => {
  it('mengisi bentuk kosong yang benar untuk field yang belum ada nilainya', () => {
    const hasil = nilaiAwalKoleksi(skillCategories, {})
    expect(hasil).toEqual({ category_name: { id: '', en: '' }, skills: [] })
  })

  it('memakai nilai dari nilaiAwal kalau field itu sudah ada (mis. edit entri lama)', () => {
    const hasil = nilaiAwalKoleksi(skillCategories, {
      category_name: { id: 'Frontend', en: 'Frontend' },
    })
    expect(hasil.category_name).toEqual({ id: 'Frontend', en: 'Frontend' })
    // skills tidak disediakan di nilaiAwal -> tetap diisi bentuk kosong.
    expect(hasil.skills).toEqual([])
  })

  it('regresi: null dari database diperlakukan sama seperti kunci yang hilang, bukan dipakai apa adanya', () => {
    // Ditemukan di koleksi singleton Task 3: site_settings.og_image/favicon/
    // resume_pdf memang `null` di database untuk kolom yang belum pernah
    // diisi (bukan kunci yang hilang — kuncinya ADA, nilainya `null`).
    const definisi: DefinisiKoleksi = {
      slug: 'contoh-nullable',
      tabel: 'contoh_nullable',
      label: 'Contoh',
      labelTunggal: 'Contoh',
      kolomJudul: 'catatan',
      field: [
        { nama: 'catatan', label: 'Catatan', jenis: 'teks' },
        { nama: 'tautan', label: 'Tautan', jenis: 'url' },
        { nama: 'berkas', label: 'Berkas', jenis: 'berkas' },
        { nama: 'gambar', label: 'Gambar', jenis: 'media' },
      ],
    }

    const hasil = nilaiAwalKoleksi(definisi, {
      catatan: null,
      tautan: null,
      berkas: null,
      gambar: null,
    })

    // Bentuk kosong yang benar per jenis — BUKAN `null` mentah.
    expect(hasil.catatan).toBe('')
    expect(hasil.tautan).toBe('')
    expect(hasil.berkas).toBe('')
    expect(hasil.gambar).toEqual({ path: '', alt: { id: '', en: '' } })

    // Bukti praktis: skema Zod field TIDAK wajib dibungkus `.optional()`,
    // yang HANYA menerima `undefined` — bukan `null`. Tanpa perbaikan di
    // `nilaiAwalKoleksi`, menyimpan ulang koleksi ini TANPA menyentuh satu
    // pun field kosongnya (kasus paling umum: ubah satu field lalu klik
    // Simpan) akan selalu gagal validasi, walau tidak ada satu pun field di
    // sini yang wajib diisi.
    const validasi = buatSkemaKoleksi(definisi).safeParse(hasil)
    expect(validasi.success).toBe(true)
  })

  it('regresi: tanpa ini, field terlokalisasi wajib yang sama sekali kosong gagal di jalur field itu sendiri (bukan .id/.en), sehingga tidak ada error per-bahasa yang bisa ditampilkan', () => {
    const skema = buatSkemaKoleksi(skillCategories)

    // Nilai APA ADANYA (tanpa nilaiAwalKoleksi) — category_name benar-benar
    // tidak ada di objek, bukan {id:'', en:''}.
    const hasilTanpaDefault = skema.safeParse({})
    if (hasilTanpaDefault.success) throw new Error('seharusnya gagal validasi')
    const petaTanpaDefault = petaErrorDariZod(hasilTanpaDefault.error)
    expect(petaTanpaDefault['category_name.id']).toBeUndefined()
    expect(petaTanpaDefault['category_name.en']).toBeUndefined()

    // Dengan nilaiAwalKoleksi, category_name sudah berbentuk {id:'', en:''}
    // sejak awal — sekarang errornya sampai ke jalur .id/.en yang benar.
    const hasilDenganDefault = skema.safeParse(nilaiAwalKoleksi(skillCategories, {}))
    if (hasilDenganDefault.success) throw new Error('seharusnya gagal validasi')
    const petaDenganDefault = petaErrorDariZod(hasilDenganDefault.error)
    expect(petaDenganDefault['category_name.id']).toBe('Wajib diisi')
    expect(petaDenganDefault['category_name.en']).toBe('Wajib diisi')
  })

  it('mengisi bentuk kosong rekursif untuk field grup (dipakai FieldGrup: nilai undefined tidak boleh menjalar)', () => {
    const definisiCta: DefinisiField = {
      nama: 'cta_primary',
      label: 'CTA Utama',
      jenis: 'grup',
      wajib: true,
      anak: [
        { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
        { nama: 'link', label: 'Tautan', jenis: 'url', wajib: true },
      ],
    }
    expect(nilaiAwalField(definisiCta)).toEqual({ label: { id: '', en: '' }, link: '' })
  })

  it('regresi grup: tanpa bentuk kosong, grup wajib yang sama sekali kosong gagal di jalur field itu sendiri, bukan di jalur anaknya', () => {
    const definisiKoleksi: DefinisiKoleksi = {
      slug: 'contoh-hero',
      tabel: 'contoh_hero',
      label: 'Contoh Hero',
      labelTunggal: 'Contoh Hero',
      kolomJudul: 'nama',
      field: [
        {
          nama: 'cta_primary',
          label: 'CTA Utama',
          jenis: 'grup',
          wajib: true,
          anak: [
            { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
            { nama: 'link', label: 'Tautan', jenis: 'url', wajib: true },
          ],
        },
      ],
    }
    const skema = buatSkemaKoleksi(definisiKoleksi)

    // Tanpa nilaiAwalKoleksi: cta_primary sama sekali tidak ada di objek.
    const hasilTanpaDefault = skema.safeParse({})
    if (hasilTanpaDefault.success) throw new Error('seharusnya gagal validasi')
    const petaTanpaDefault = petaErrorDariZod(hasilTanpaDefault.error)
    expect(petaTanpaDefault['cta_primary.label.id']).toBeUndefined()

    // Dengan nilaiAwalKoleksi: cta_primary sudah berbentuk {label:{id:'',en:''}, link:''}.
    const hasilDenganDefault = skema.safeParse(nilaiAwalKoleksi(definisiKoleksi, {}))
    if (hasilDenganDefault.success) throw new Error('seharusnya gagal validasi')
    const petaDenganDefault = petaErrorDariZod(hasilDenganDefault.error)
    expect(petaDenganDefault['cta_primary.label.id']).toBe('Wajib diisi')
    expect(petaDenganDefault['cta_primary.label.en']).toBe('Wajib diisi')
    expect(petaDenganDefault['cta_primary.link']).toBe('URL tidak valid')
  })
})

describe('nilaiAwalField untuk media dan berkas', () => {
  it('media mendapat bentuk objek lengkap dengan alt dwibahasa', () => {
    const bentuk = nilaiAwalField({ nama: 'profile_photo', label: 'Foto', jenis: 'media' })
    expect(bentuk).toEqual({ path: '', alt: { id: '', en: '' } })
  })

  it('media wajib yang kosong menempatkan error di jalur alt, bukan di jalur field', () => {
    // Inilah alasan bentuk kosongnya harus benar sejak awal. Kalau nilai awal
    // bukan objek, Zod gagal di jalur ['profile_photo'] dan input alt yang
    // bersangkutan tidak pernah menerima errornya — pengisi form tak melihat
    // peringatan apa pun di bahasa yang terlewat.
    const definisi: DefinisiKoleksi = {
      slug: 'uji', tabel: 'uji', label: 'Uji', labelTunggal: 'Uji',
      kolomJudul: 'profile_photo',
      field: [{ nama: 'profile_photo', label: 'Foto', jenis: 'media', wajib: true }],
    }
    const hasil = buatSkemaKoleksi(definisi).safeParse(nilaiAwalKoleksi(definisi))
    expect(hasil.success).toBe(false)
    if (hasil.success) return

    const jalur = hasil.error.issues.map((i) => i.path.join('.'))
    expect(jalur.some((j) => j.startsWith('profile_photo.alt'))).toBe(true)
  })

  it('berkas mendapat string kosong, bukan objek', () => {
    const bentuk = nilaiAwalField({ nama: 'resume_pdf', label: 'CV', jenis: 'berkas' })
    expect(bentuk).toBe('')
  })
})
