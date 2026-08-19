import type { DefinisiKoleksi } from './tipe'

export const experiences: DefinisiKoleksi = {
  slug: 'experiences',
  tabel: 'experiences',
  label: 'Pengalaman Kerja',
  labelTunggal: 'Pengalaman',
  kolomJudul: 'company',
  field: [
    {
      nama: 'company',
      label: 'Perusahaan',
      jenis: 'terlokalisasi',
      wajib: true,
      petunjuk: 'Samarkan bila perlu, mis. "Platform Properti B2C" (keputusan D5).',
    },
    { nama: 'role', label: 'Peran', jenis: 'terlokalisasi', wajib: true },
    { nama: 'period_start', label: 'Mulai', jenis: 'tanggal', wajib: true },
    {
      nama: 'period_end',
      label: 'Selesai',
      jenis: 'tanggal',
      // Kosong berarti masih berjalan; Timeline.tsx menampilkannya sebagai
      // "Sekarang" / "Present". Database juga memasang CHECK bahwa period_end
      // tidak boleh mendahului period_start.
      petunjuk: 'Kosongkan bila masih berjalan. Tidak boleh lebih awal dari tanggal mulai.',
    },
    { nama: 'location', label: 'Lokasi', jenis: 'teks' },
    {
      nama: 'responsibilities',
      label: 'Tanggung Jawab',
      jenis: 'repeater',
      anak: [{ nama: 'text', label: 'Poin', jenis: 'terlokalisasi', wajib: true }],
    },
    {
      nama: 'achievements',
      label: 'Pencapaian',
      jenis: 'repeater',
      anak: [{ nama: 'text', label: 'Poin', jenis: 'terlokalisasi', wajib: true }],
    },
  ],
}
