import { describe, expect, it } from 'vitest'
import { buatSkemaField, buatSkemaKoleksi, petaErrorDariZod } from '@/lib/admin/skema/ke-zod'
import { skillCategories } from '@/lib/admin/skema/skill-categories'
import type { DefinisiField, DefinisiKoleksi } from '@/lib/admin/skema/tipe'

describe('buatSkemaField — terlokalisasi wajib', () => {
  const definisi: DefinisiField = {
    nama: 'category_name',
    label: 'Nama Kategori',
    jenis: 'terlokalisasi',
    wajib: true,
  }
  const skema = buatSkemaField(definisi)

  it('menolak { id: "", en: "" }', () => {
    expect(skema.safeParse({ id: '', en: '' }).success).toBe(false)
  })

  it('menerima { id: "a", en: "b" }', () => {
    expect(skema.safeParse({ id: 'a', en: 'b' }).success).toBe(true)
  })

  it('menolak objek yang kehilangan kunci en', () => {
    expect(skema.safeParse({ id: 'Frontend Developer' }).success).toBe(false)
  })

  it('menolak bila salah satu bahasa saja yang kosong', () => {
    expect(skema.safeParse({ id: 'Frontend Developer', en: '' }).success).toBe(false)
    expect(skema.safeParse({ id: '', en: 'Frontend Developer' }).success).toBe(false)
  })
})

describe('buatSkemaField — angka', () => {
  const definisi: DefinisiField = {
    nama: 'proficiency_percent',
    label: 'Penguasaan (%)',
    jenis: 'angka',
    wajib: true,
    min: 0,
    max: 100,
  }
  const skema = buatSkemaField(definisi)

  it('menghormati min dan max', () => {
    expect(skema.safeParse(-1).success).toBe(false)
    expect(skema.safeParse(101).success).toBe(false)
    expect(skema.safeParse(0).success).toBe(true)
    expect(skema.safeParse(100).success).toBe(true)
    expect(skema.safeParse(87).success).toBe(true)
  })
})

describe('buatSkemaField — pilihan', () => {
  const definisi: DefinisiField = {
    nama: 'availability_status',
    label: 'Status Ketersediaan',
    jenis: 'pilihan',
    wajib: true,
    opsi: [
      { nilai: 'available', label: 'Tersedia' },
      { nilai: 'open', label: 'Terbuka untuk peluang' },
      { nilai: 'unavailable', label: 'Tidak tersedia' },
    ],
  }
  const skema = buatSkemaField(definisi)

  it('menolak nilai di luar opsi', () => {
    expect(skema.safeParse('sedang-cuti').success).toBe(false)
  })

  it('menerima nilai yang ada di opsi', () => {
    expect(skema.safeParse('open').success).toBe(true)
  })
})

describe('buatSkemaField — url', () => {
  it('menolak string yang bukan URL ketika wajib', () => {
    const definisi: DefinisiField = {
      nama: 'github_url',
      label: 'Tautan GitHub',
      jenis: 'url',
      wajib: true,
    }
    const skema = buatSkemaField(definisi)
    expect(skema.safeParse('github.com/bukan-url-valid').success).toBe(false)
    expect(skema.safeParse('https://github.com/contoh').success).toBe(true)
  })

  it('menerima string kosong ketika field tidak wajib', () => {
    const definisi: DefinisiField = {
      nama: 'linkedin_url',
      label: 'Tautan LinkedIn',
      jenis: 'url',
    }
    const skema = buatSkemaField(definisi)
    expect(skema.safeParse('').success).toBe(true)
    expect(skema.safeParse('https://linkedin.com/in/contoh').success).toBe(true)
  })
})

describe('buatSkemaField — daftar-teks', () => {
  const definisi: DefinisiField = {
    nama: 'tools_used',
    label: 'Tool yang Dipakai',
    jenis: 'daftar-teks',
  }
  const skema = buatSkemaField(definisi)

  it('menerima array string', () => {
    expect(skema.safeParse(['Playwright', 'Vitest', 'Zod']).success).toBe(true)
  })

  it('menolak array berisi non-string', () => {
    expect(skema.safeParse(['Playwright', 42]).success).toBe(false)
  })
})

describe('buatSkemaField — repeater', () => {
  // Ambil field 'skills' persis dari definisi skillCategories yang sesungguhnya,
  // bukan menulis ulang bentuknya — supaya test ini mengikat ke definisi asli.
  const definisi = skillCategories.field.find((f) => f.nama === 'skills')
  if (!definisi) throw new Error('Field "skills" tidak ditemukan di skillCategories')
  const skema = buatSkemaField(definisi)

  it('memvalidasi setiap baris dan pesan errornya menyebut indeks baris yang salah', () => {
    const data = [
      { name: 'React', proficiency_percent: 90, years: 3 },
      { name: 'TypeScript', proficiency_percent: 85, years: 3 },
      { name: 'Playwright', proficiency_percent: 80, years: 2 },
      { name: 'Cypress', proficiency_percent: 60, years: 1 },
      { name: 'Vitest', proficiency_percent: 150, years: 1 }, // baris ke-5 (indeks 4): 150 > max 100
    ]
    const hasil = skema.safeParse(data)
    expect(hasil.success).toBe(false)
    if (hasil.success) return
    const path = hasil.error.issues[0]?.path
    expect(path).toEqual([4, 'proficiency_percent'])
  })

  it('baris kosong ([]) diterima karena field "skills" tidak wajib', () => {
    expect(skema.safeParse([]).success).toBe(true)
  })
})

describe('buatSkemaField — grup', () => {
  // Bentuk hero.cta_primary: { label: LocalizedText, link: url }.
  const anakCta: DefinisiField[] = [
    { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
    { nama: 'link', label: 'Tautan', jenis: 'url', wajib: true },
  ]
  const definisi: DefinisiField = {
    nama: 'cta_primary',
    label: 'CTA Utama',
    jenis: 'grup',
    wajib: true,
    anak: anakCta,
  }
  const skema = buatSkemaField(definisi)

  it('kasus 1: menolak bila field anak yang wajib kosong, path error menyebut nama anaknya', () => {
    const hasil = skema.safeParse({ label: { id: 'Lihat', en: 'View' }, link: '' })
    expect(hasil.success).toBe(false)
    if (hasil.success) return
    const paths = hasil.error.issues.map((i) => i.path.join('.'))
    expect(paths).toContain('link')
  })

  it('kasus 4: anak terlokalisasi di dalam grup tetap divalidasi kedua bahasanya', () => {
    const hasil = skema.safeParse({ label: { id: '', en: '' }, link: 'https://contoh.test' })
    expect(hasil.success).toBe(false)
    if (hasil.success) return
    const paths = hasil.error.issues.map((i) => i.path.join('.'))
    expect(paths).toContain('label.id')
    expect(paths).toContain('label.en')
  })

  it('menerima objek yang sah', () => {
    const hasil = skema.safeParse({ label: { id: 'Lihat', en: 'View' }, link: 'https://contoh.test' })
    expect(hasil.success).toBe(true)
  })
})

describe('buatSkemaField — grup bersarang di dalam grup', () => {
  // Bentuk mirip lab_scenarios.result_summary tapi sengaja dibuat 2 tingkat
  // untuk membuktikan path bertingkat tetap benar (kasus 2).
  const anakDalam: DefinisiField[] = [{ nama: 'total', label: 'Total', jenis: 'angka', wajib: true }]
  const definisi: DefinisiField = {
    nama: 'result_summary',
    label: 'Ringkasan Hasil',
    jenis: 'grup',
    wajib: true,
    anak: [{ nama: 'ringkas', label: 'Ringkas', jenis: 'grup', wajib: true, anak: anakDalam }],
  }
  const skema = buatSkemaField(definisi)

  it('kasus 2: path error grup di dalam grup bertingkat dua level dengan benar', () => {
    const hasil = skema.safeParse({ ringkas: {} })
    expect(hasil.success).toBe(false)
    if (hasil.success) return
    expect(hasil.error.issues[0]?.path).toEqual(['ringkas', 'total'])
  })
})

describe('buatSkemaField — grup opsional', () => {
  const definisi: DefinisiField = {
    nama: 'cta_secondary',
    label: 'CTA Sekunder',
    jenis: 'grup',
    anak: [
      { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
      { nama: 'link', label: 'Tautan', jenis: 'url', wajib: true },
    ],
  }
  const skema = buatSkemaField(definisi)

  it('kasus 3: grup opsional yang kosong (undefined) tidak memicu error', () => {
    expect(skema.safeParse(undefined).success).toBe(true)
  })
})

describe('buatSkemaKoleksi — grup di dalam koleksi (path lengkap lewat petaErrorDariZod)', () => {
  const definisiKoleksi: DefinisiKoleksi = {
    slug: 'contoh-grup',
    tabel: 'contoh_grup',
    label: 'Contoh Grup',
    labelTunggal: 'Contoh Grup',
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

  it('path error anak terlokalisasi di dalam grup adalah "cta_primary.label.id" / "cta_primary.label.en"', () => {
    const hasil = skema.safeParse({ cta_primary: { label: { id: '', en: '' }, link: 'https://contoh.test' } })
    expect(hasil.success).toBe(false)
    if (hasil.success) return
    const peta = petaErrorDariZod(hasil.error)
    expect(peta['cta_primary.label.id']).toBe('Wajib diisi')
    expect(peta['cta_primary.label.en']).toBe('Wajib diisi')
  })
})

describe('buatSkemaField — field opsional kosong', () => {
  it('tidak memicu error ketika kosong/hilang', () => {
    const definisi: DefinisiField = {
      nama: 'location',
      label: 'Lokasi',
      jenis: 'teks',
    }
    const skema = buatSkemaField(definisi)
    expect(skema.safeParse('').success).toBe(true)
    expect(skema.safeParse(undefined).success).toBe(true)
  })
})

describe('buatSkemaKoleksi — skillCategories (skema sesungguhnya)', () => {
  const skema = buatSkemaKoleksi(skillCategories)

  it('menerima satu contoh data yang sah', () => {
    const hasil = skema.safeParse({
      category_name: { id: 'Pengujian Otomatis', en: 'Test Automation' },
      skills: [
        { name: 'Playwright', proficiency_percent: 90, years: 3 },
        { name: 'Vitest', proficiency_percent: 85, years: 2 },
      ],
    })
    expect(hasil.success).toBe(true)
  })

  it('menolak satu contoh yang tidak sah (nama kosong dua bahasa + baris repeater rusak)', () => {
    const hasil = skema.safeParse({
      category_name: { id: '', en: '' },
      skills: [{ name: '', proficiency_percent: 200, years: 1 }],
    })
    expect(hasil.success).toBe(false)
  })
})

describe('petaErrorDariZod', () => {
  const skema = buatSkemaKoleksi(skillCategories)

  it('meratakan error field terlokalisasi ke jalur "field.bahasa"', () => {
    const hasil = skema.safeParse({ category_name: { id: '', en: '' }, skills: [] })
    if (hasil.success) throw new Error('seharusnya gagal validasi')

    const peta = petaErrorDariZod(hasil.error)
    expect(peta['category_name.id']).toBe('Wajib diisi')
    expect(peta['category_name.en']).toBe('Wajib diisi')
  })

  it('meratakan error baris repeater ke jalur "field.indeks.subfield"', () => {
    const hasil = skema.safeParse({
      category_name: { id: 'a', en: 'b' },
      skills: [
        { name: 'React', proficiency_percent: 90, years: 3 },
        { name: '', proficiency_percent: 90, years: 1 },
        { name: 'Vue', proficiency_percent: 999, years: 1 },
      ],
    })
    if (hasil.success) throw new Error('seharusnya gagal validasi')

    const peta = petaErrorDariZod(hasil.error)
    // Baris ke-1 (indeks 1) valid semua — tidak boleh punya entri error.
    expect(peta['skills.0.name']).toBeUndefined()
    // Baris kedua (indeks 1): nama kosong.
    expect(peta['skills.1.name']).toBe('Wajib diisi')
    // Baris ketiga (indeks 2): persentase di luar batas.
    expect(peta['skills.2.proficiency_percent']).toBe('Maksimal 100')
  })
})
