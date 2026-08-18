import { describe, expect, it } from 'vitest'
import { bacaNilai, nilaiAwalKoleksi, tulisNilai } from '@/lib/admin/nilai'
import { skillCategories } from '@/lib/admin/skema/skill-categories'
import { buatSkemaKoleksi, petaErrorDariZod } from '@/lib/admin/skema/ke-zod'

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
})
