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
