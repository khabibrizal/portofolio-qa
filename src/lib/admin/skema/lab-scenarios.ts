import type { DefinisiKoleksi } from './tipe'

export const labScenarios: DefinisiKoleksi = {
  slug: 'lab-scenarios',
  tabel: 'lab_scenarios',
  label: 'Automation Lab',
  labelTunggal: 'Skenario',
  kolomJudul: 'scenario_title',
  field: [
    {
      nama: 'framework_name',
      label: 'Framework',
      jenis: 'teks',
      wajib: true,
      petunjuk: 'Muncul sebagai label tab, mis. Playwright atau k6.',
    },
    { nama: 'scenario_title', label: 'Judul Skenario', jenis: 'terlokalisasi', wajib: true },
    {
      nama: 'scenario_description',
      label: 'Deskripsi',
      jenis: 'terlokalisasi-panjang',
      wajib: true,
    },
    { nama: 'tags', label: 'Tag', jenis: 'daftar-teks' },
    {
      nama: 'steps',
      label: 'Langkah Eksekusi',
      jenis: 'repeater',
      // Bentuk ini sengaja mengikuti keluaran report asli (D4), supaya ingest
      // otomatis dari CI kelak cukup mengganti sumber datanya — bukan skemanya.
      petunjuk: 'Ambil dari hasil run asli, jangan dikarang — durasinya dipakai untuk animasi replay.',
      anak: [
        { nama: 'label', label: 'Langkah', jenis: 'terlokalisasi', wajib: true },
        { nama: 'duration_ms', label: 'Durasi (ms)', jenis: 'angka', wajib: true, min: 0 },
        { nama: 'status', label: 'Status', jenis: 'teks', wajib: true },
      ],
    },
    {
      nama: 'result_summary',
      label: 'Ringkasan Hasil',
      jenis: 'grup',
      anak: [
        { nama: 'total', label: 'Total Test', jenis: 'angka', wajib: true, min: 0 },
        { nama: 'passed', label: 'Lulus', jenis: 'angka', wajib: true, min: 0 },
        { nama: 'failed', label: 'Gagal', jenis: 'angka', wajib: true, min: 0 },
        // Teks, bukan angka — nilainya berbentuk "4.1s".
        { nama: 'duration', label: 'Durasi', jenis: 'teks', wajib: true },
      ],
    },
    {
      nama: 'kode',
      label: 'Cuplikan Kode',
      jenis: 'teks-panjang',
      petunjuk: 'Tempel apa adanya. Tidak diterjemahkan — kode sama untuk kedua bahasa.',
    },
    {
      nama: 'kode_bahasa',
      label: 'Bahasa Kode',
      jenis: 'teks',
      petunjuk: 'Label di atas cuplikan, mis. TypeScript atau Gherkin.',
    },
    {
      nama: 'repo_url',
      label: 'Tautan Berkas di Repo',
      jenis: 'url',
      petunjuk: 'Cuplikan bisa basi; tautan ke sumbernya tidak.',
    },
    {
      nama: 'full_report_url',
      label: 'URL Report Lengkap',
      jenis: 'url',
      petunjuk: 'Boleh kosong. Kalau diisi, tombol "Lihat Report Lengkap" muncul.',
    },
  ],
}
