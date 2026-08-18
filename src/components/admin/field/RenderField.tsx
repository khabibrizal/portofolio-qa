import type { DefinisiField } from '@/lib/admin/skema/tipe'
import type { Jalur } from '@/lib/admin/nilai'
import { FieldTeks } from './FieldTeks'
import { FieldAngka } from './FieldAngka'
import { FieldPilihan } from './FieldPilihan'
import { FieldTerlokalisasi } from './FieldTerlokalisasi'
import { FieldRepeater } from './FieldRepeater'

export type OnChangeField = (jalur: Jalur, nilaiBaru: unknown) => void
export type PetaError = Record<string, string>

/**
 * Dispatcher jenis -> komponen field. Satu-satunya tempat pemetaan ini
 * didefinisikan, dipakai baik oleh `FormSkema` (field level atas) maupun
 * `FieldRepeater` (field di dalam tiap baris) — supaya field bersarang di
 * repeater dirender PERSIS sama seperti field di level atas, termasuk
 * repeater di dalam repeater kalau suatu koleksi nanti membutuhkannya.
 */
export function RenderField({
  definisi,
  jalur,
  nilai,
  errors,
  onChange,
}: {
  definisi: DefinisiField
  jalur: Jalur
  nilai: unknown
  errors: PetaError
  onChange: OnChangeField
}) {
  const kunciError = errors[jalur.join('.')]

  switch (definisi.jenis) {
    case 'teks':
    case 'teks-panjang':
    case 'tanggal':
    case 'url':
      return (
        <FieldTeks
          definisi={definisi}
          jalur={jalur}
          nilai={typeof nilai === 'string' ? nilai : ''}
          error={kunciError}
          onChange={onChange}
        />
      )

    case 'angka':
      return (
        <FieldAngka
          definisi={definisi}
          jalur={jalur}
          nilai={typeof nilai === 'number' ? nilai : undefined}
          error={kunciError}
          onChange={onChange}
        />
      )

    case 'pilihan':
      return (
        <FieldPilihan
          definisi={definisi}
          jalur={jalur}
          nilai={typeof nilai === 'string' ? nilai : ''}
          error={kunciError}
          onChange={onChange}
        />
      )

    case 'terlokalisasi':
    case 'terlokalisasi-panjang': {
      const objek = (nilai ?? {}) as { id?: string; en?: string }
      return (
        <FieldTerlokalisasi
          definisi={definisi}
          jalur={jalur}
          nilai={{ id: objek.id ?? '', en: objek.en ?? '' }}
          errors={{
            id: errors[[...jalur, 'id'].join('.')],
            en: errors[[...jalur, 'en'].join('.')],
          }}
          onChange={onChange}
        />
      )
    }

    case 'repeater':
      return (
        <FieldRepeater
          definisi={definisi}
          jalur={jalur}
          nilai={Array.isArray(nilai) ? nilai : []}
          errors={errors}
          onChange={onChange}
        />
      )

    case 'daftar-teks': {
      // Belum ada komponen khusus untuk 'daftar-teks' di Fase 2a — tidak
      // dipakai skill_categories. Fallback tekstual (pisah-koma) sekadar
      // supaya registry tidak meledak kalau koleksi lain memakainya sebelum
      // Fase 2b membangun komponennya sendiri. TIDAK diuji di sini karena
      // di luar cakupan Task 4 — lihat laporan penyimpangan.
      const daftar = Array.isArray(nilai) ? (nilai as unknown[]).map(String) : []
      return (
        <FieldTeks
          definisi={{ ...definisi, jenis: 'teks' }}
          jalur={jalur}
          nilai={daftar.join(', ')}
          error={kunciError}
          onChange={(j, v) =>
            onChange(
              j,
              String(v)
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
      )
    }

    default:
      return takTerduga(definisi.jenis)
  }
}

function takTerduga(jenis: never): never {
  throw new Error(`Jenis field tidak dikenal: ${String(jenis)}`)
}
