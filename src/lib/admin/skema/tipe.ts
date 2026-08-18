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
