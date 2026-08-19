import type { DefinisiKoleksi } from './tipe'

export const caseStudies: DefinisiKoleksi = {
  slug: 'case-studies',
  tabel: 'case_studies',
  label: 'Studi Kasus',
  labelTunggal: 'Studi Kasus',
  kolomJudul: 'project_name',
  field: [
    {
      nama: 'test_code',
      label: 'Kode TC',
      jenis: 'teks',
      wajib: true,
      // Kolomnya UNIQUE di database (migrasi Fase 1a) dan nilainya TERSIMPAN,
      // bukan diturunkan dari urutan (D9): memindahkan urutan kartu tidak boleh
      // menggeser nomor yang sudah pernah dibagikan ke orang.
      petunjuk: 'Harus unik, mis. TC-001. Jangan diubah setelah dibagikan ke orang.',
    },
    {
      nama: 'project_name',
      label: 'Nama Proyek',
      jenis: 'terlokalisasi',
      wajib: true,
      // Keputusan D5: nama perusahaan disamarkan, angka hasil tetap asli.
      petunjuk: 'Samarkan nama perusahaan, mis. "Platform Properti B2C".',
    },
    { nama: 'role', label: 'Peran', jenis: 'terlokalisasi', wajib: true },
    { nama: 'objective', label: 'Masalah yang Diselesaikan', jenis: 'terlokalisasi', wajib: true },
    {
      nama: 'tools_used',
      label: 'Tools',
      jenis: 'daftar-teks',
      petunjuk: 'Nama tool apa adanya, tidak diterjemahkan.',
    },
    {
      nama: 'process_steps',
      label: 'Langkah Pengerjaan',
      jenis: 'repeater',
      anak: [{ nama: 'text', label: 'Langkah', jenis: 'terlokalisasi', wajib: true }],
    },
    {
      nama: 'result_metrics',
      label: 'Metrik Hasil',
      jenis: 'repeater',
      petunjuk: 'Angka hasil boleh apa adanya meski nama proyeknya disamarkan.',
      anak: [
        { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
        // Teks, bukan angka — nilainya berbentuk "3 hari → 4 jam" atau "-40%".
        { nama: 'value', label: 'Nilai', jenis: 'teks', wajib: true },
      ],
    },
    {
      nama: 'evidence_links',
      label: 'Tautan Bukti',
      jenis: 'repeater',
      anak: [
        { nama: 'label', label: 'Label', jenis: 'terlokalisasi', wajib: true },
        { nama: 'url', label: 'URL', jenis: 'url', wajib: true },
      ],
    },
    {
      nama: 'status_badge',
      label: 'Status Pengerjaan',
      jenis: 'pilihan',
      wajib: true,
      opsi: [
        { nilai: 'completed', label: 'Selesai' },
        { nilai: 'ongoing', label: 'Berjalan' },
      ],
    },
  ],
}
