// Mendaftarkan matcher jest-dom (toBeVisible, toHaveTextContent, dst.) ke
// `expect` Vitest untuk seluruh test di project 'komponen'. Hanya project ini
// yang butuh jsdom + matcher DOM; test di tests/unit (project 'node') tidak
// menyentuh berkas ini sama sekali.
import '@testing-library/jest-dom/vitest'

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Vitest tidak globals=true, jadi cleanup otomatis testing-library (yang
// mendeteksi hook global ala Jest) tidak terpicu — tanpa ini, DOM dari test
// sebelumnya tetap menempel di document dan test berikutnya di FILE yang
// sama menemukan elemen DUPLIKAT (mis. dua tombol tab "English").
afterEach(() => {
  cleanup()
})

// jsdom tidak mengimplementasikan window.matchMedia maupun
// IntersectionObserver. Keduanya dipakai komponen yang menghormati
// `prefers-reduced-motion` (LabRunner, SkillBars) dan yang menunda animasi
// sampai terlihat (SkillBars) — tanpa stub ini komponennya melempar
// "matchMedia is not a function" saat useState diinisialisasi, dan
// kegagalannya terbaca seperti bug React, bukan celah lingkungan uji.
//
// Nilainya sengaja "tidak mengurangi gerak" dan "tidak pernah terlihat":
// itu jalur bawaan yang dialami mayoritas pengunjung. Test yang perlu jalur
// sebaliknya menimpanya sendiri.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  }

  // Dipisah ke variabel bertipe longgar: `'X' in window` mempersempit tipe
  // window sehingga akses berikutnya dianggap `never` oleh TypeScript.
  const w = window as unknown as Record<string, unknown>
  if (!w.IntersectionObserver) {
    class ObserverPalsu {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
      readonly root = null
      readonly rootMargin = ''
      readonly thresholds: ReadonlyArray<number> = []
    }
    w.IntersectionObserver = ObserverPalsu
  }
}
