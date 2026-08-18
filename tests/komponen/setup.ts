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
