import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldRepeater } from '@/components/admin/field/FieldRepeater'
import type { DefinisiField } from '@/lib/admin/skema/tipe'

const anakSkill: DefinisiField[] = [
  { nama: 'name', label: 'Nama', jenis: 'teks', wajib: true },
  { nama: 'proficiency_percent', label: 'Penguasaan (%)', jenis: 'angka', wajib: true, min: 0, max: 100 },
]

const definisiSkills: DefinisiField = {
  nama: 'skills',
  label: 'Keahlian',
  jenis: 'repeater',
  anak: anakSkill,
}

function tigaBaris() {
  return [
    { name: 'React', proficiency_percent: 90 },
    { name: 'Vue', proficiency_percent: 70 },
    { name: 'Svelte', proficiency_percent: 60 },
  ]
}

/** Pembungkus stateful — FieldRepeater sendiri terkendali penuh dari luar. */
function Pembungkus({
  nilaiAwal,
  errors = {},
}: {
  nilaiAwal: Record<string, unknown>[]
  errors?: Record<string, string>
}) {
  const [nilai, setNilai] = useState<unknown[]>(nilaiAwal)
  return (
    <FieldRepeater
      definisi={definisiSkills}
      jalur={['skills']}
      nilai={nilai}
      errors={errors}
      onChange={(_, nilaiBaru) => setNilai(nilaiBaru as unknown[])}
    />
  )
}

function namaDiBaris(labelBaris: string) {
  return within(screen.getByRole('group', { name: labelBaris })).getByLabelText('Nama', { exact: false })
}

describe('FieldRepeater — kasus 3: tambah baris', () => {
  it('menambahkan satu baris kosong di akhir tanpa mengubah baris yang ada', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={tigaBaris()} />)

    expect(screen.getAllByRole('group')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: /tambah/i }))

    const baris = screen.getAllByRole('group')
    expect(baris).toHaveLength(4)
    expect(namaDiBaris('Baris 1')).toHaveValue('React')
    expect(namaDiBaris('Baris 2')).toHaveValue('Vue')
    expect(namaDiBaris('Baris 3')).toHaveValue('Svelte')
    expect(namaDiBaris('Baris 4')).toHaveValue('')
  })
})

describe('FieldRepeater — kasus 4: hapus baris yang benar', () => {
  it('menghapus baris kedua dari tiga menyisakan baris 1 dan 3, BUKAN 1 dan 2', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={tigaBaris()} />)

    await user.click(within(screen.getByRole('group', { name: 'Baris 2' })).getByRole('button', { name: /hapus/i }))

    const barisTersisa = screen.getAllByRole('group')
    expect(barisTersisa).toHaveLength(2)
    // Isi baris yang tersisa harus React & Svelte — BUKAN React & Vue, yang
    // akan terjadi kalau penghapusan salah sasaran (mis. menghapus baris
    // ketiga karena bingung index vs identitas baris).
    expect(namaDiBaris('Baris 1')).toHaveValue('React')
    expect(namaDiBaris('Baris 2')).toHaveValue('Svelte')
  })

  it('menghapus baris pertama menyisakan Vue dan Svelte dengan urutan tetap', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={tigaBaris()} />)

    await user.click(within(screen.getByRole('group', { name: 'Baris 1' })).getByRole('button', { name: /hapus/i }))

    expect(namaDiBaris('Baris 1')).toHaveValue('Vue')
    expect(namaDiBaris('Baris 2')).toHaveValue('Svelte')
  })
})

describe('FieldRepeater — kasus 5: naik/turun menukar urutan', () => {
  it('menekan turun pada baris pertama menukarnya dengan baris kedua', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={tigaBaris()} />)

    await user.click(within(screen.getByRole('group', { name: 'Baris 1' })).getByRole('button', { name: /turunkan/i }))

    expect(namaDiBaris('Baris 1')).toHaveValue('Vue')
    expect(namaDiBaris('Baris 2')).toHaveValue('React')
    expect(namaDiBaris('Baris 3')).toHaveValue('Svelte')
  })

  it('menekan naik pada baris terakhir menukarnya dengan baris sebelumnya', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={tigaBaris()} />)

    await user.click(within(screen.getByRole('group', { name: 'Baris 3' })).getByRole('button', { name: /naikkan/i }))

    expect(namaDiBaris('Baris 1')).toHaveValue('React')
    expect(namaDiBaris('Baris 2')).toHaveValue('Svelte')
    expect(namaDiBaris('Baris 3')).toHaveValue('Vue')
  })

  it('tombol naik di baris pertama dan turun di baris terakhir nonaktif, tidak merusak apa pun', async () => {
    const user = userEvent.setup()
    render(<Pembungkus nilaiAwal={tigaBaris()} />)

    const tombolNaikPertama = within(screen.getByRole('group', { name: 'Baris 1' })).getByRole('button', {
      name: /naikkan/i,
    })
    const tombolTurunTerakhir = within(screen.getByRole('group', { name: 'Baris 3' })).getByRole('button', {
      name: /turunkan/i,
    })

    expect(tombolNaikPertama).toBeDisabled()
    expect(tombolTurunTerakhir).toBeDisabled()

    // Mengeklik tombol nonaktif tidak melakukan apa pun (disabled mencegah
    // event, tapi ditegaskan di sini supaya urutan benar-benar tidak berubah).
    await user.click(tombolNaikPertama).catch(() => {})
    await user.click(tombolTurunTerakhir).catch(() => {})

    expect(namaDiBaris('Baris 1')).toHaveValue('React')
    expect(namaDiBaris('Baris 2')).toHaveValue('Vue')
    expect(namaDiBaris('Baris 3')).toHaveValue('Svelte')
  })
})

describe('FieldRepeater — kasus 6: error muncul di baris yang tepat', () => {
  it('error baris ke-3 dari 4 hanya muncul di baris itu', () => {
    const empatBaris = [
      { name: 'React', proficiency_percent: 90 },
      { name: 'Vue', proficiency_percent: 70 },
      { name: '', proficiency_percent: 60 }, // baris ke-3 (indeks 2): nama kosong
      { name: 'Angular', proficiency_percent: 50 },
    ]
    const errors = { 'skills.2.name': 'Wajib diisi' }

    render(<Pembungkus nilaiAwal={empatBaris} errors={errors} />)

    expect(within(screen.getByRole('group', { name: 'Baris 3' })).getByRole('alert')).toHaveTextContent(
      'Wajib diisi',
    )
    expect(within(screen.getByRole('group', { name: 'Baris 1' })).queryByRole('alert')).not.toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Baris 2' })).queryByRole('alert')).not.toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Baris 4' })).queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('FieldRepeater — kasus 4 (lanjutan): identitas baris tidak boleh ikut posisi tampil', () => {
  // Untuk field teks/angka murni (name/proficiency_percent di atas), penghapusan
  // yang benar SECARA ISI tetap benar bahkan kalau React key-nya diganti indeks —
  // input terkendali penuh selalu menampilkan `value` dari prop terbaru, apa pun
  // instance DOM yang dipakai ulang React. Uji daya gigit di laporan tugas
  // membuktikan ini secara empiris: kasus 3-6 di atas TETAP HIJAU walau
  // `FieldRepeater` sengaja diubah memakai `key={i}`.
  //
  // Beda cerita untuk field yang membawa STATE TAMPILAN internal (di sini:
  // tab aktif `FieldTerlokalisasi`, yang secara eksplisit diizinkan spec).
  // State itu menempel ke INSTANCE komponen, dan instance itu diidentifikasi
  // React lewat `key`. Kalau key = indeks (bukan kunci stabil per baris),
  // menghapus sebuah baris membuat React menyambungkan instance yang SALAH ke
  // data baris yang tersisa — persis bug klasik yang disebut tugas ini. Test
  // di bawah adalah yang GAGAL saat `FieldRepeater` diregresi memakai
  // `key={i}` (lihat laporan "uji daya gigit").
  const anakDenganBahasa: DefinisiField[] = [
    { nama: 'name', label: 'Nama', jenis: 'teks', wajib: true },
    { nama: 'catatan', label: 'Catatan', jenis: 'terlokalisasi' },
  ]
  const definisiDenganBahasa: DefinisiField = {
    nama: 'baris',
    label: 'Baris',
    jenis: 'repeater',
    anak: anakDenganBahasa,
  }

  function PembungkusBahasa() {
    const [nilai, setNilai] = useState<unknown[]>([
      { name: 'Satu', catatan: { id: '', en: '' } },
      { name: 'Dua', catatan: { id: '', en: '' } },
      { name: 'Tiga', catatan: { id: '', en: '' } },
    ])
    return (
      <FieldRepeater
        definisi={definisiDenganBahasa}
        jalur={['baris']}
        nilai={nilai}
        errors={{}}
        onChange={(_, nilaiBaru) => setNilai(nilaiBaru as unknown[])}
      />
    )
  }

  it('tab bahasa baris yang tersisa tidak mewarisi tab aktif baris yang dihapus di atasnya', async () => {
    const user = userEvent.setup()
    render(<PembungkusBahasa />)

    // Pindah tab "Catatan" baris 2 ("Dua") ke English.
    const grupDua = screen.getByRole('group', { name: 'Baris 2' })
    await user.click(within(grupDua).getByRole('tab', { name: /english/i }))
    expect(within(grupDua).getByLabelText('Catatan (English)')).toBeInTheDocument()

    // Hapus baris 1 ("Satu"). Baris "Dua" sekarang tampil di posisi 1.
    await user.click(within(screen.getByRole('group', { name: 'Baris 1' })).getByRole('button', { name: /hapus/i }))

    const grupTersisaPertama = screen.getByRole('group', { name: 'Baris 1' })
    expect(within(grupTersisaPertama).getByLabelText('Nama', { exact: false })).toHaveValue('Dua')
    // Baris "Dua" sendiri yang tadi dipindah ke tab English — preferensi tab
    // itu milik BARIS ITU, harus ikut pindah bersama datanya ke posisi 1.
    // Kalau identitas baris diambil dari indeks tampil (bukan kunci stabil),
    // slot posisi-1 ini justru akan mewarisi tab aktif milik instance LAMA
    // yang dulu menghuni indeks 1 (baris "Satu", tab Indonesia) — bukan tab
    // yang benar-benar dipilih untuk "Dua".
    expect(within(grupTersisaPertama).getByLabelText('Catatan (English)')).toBeInTheDocument()
  })
})
