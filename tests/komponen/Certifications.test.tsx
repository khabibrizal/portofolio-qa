import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Certifications } from '@/components/sections/Certifications'
import type { Certification, Education } from '@/lib/content/types'

/**
 * Cabang `credential_url` di Certifications.tsx: kartu yang punya URL dibungkus
 * <a>, yang tidak punya tetap <div> polos. Keduanya harus benar-benar
 * dieksekusi — kalau tidak, salah satu cabang tidak pernah teruji.
 *
 * DULU INI TEST E2E, dan itu tempat yang salah. Versinya lama bersandar pada
 * seed yang kebetulan memuat satu sertifikat dengan URL dan satu tanpa, lalu
 * mengasersi nama-nama karangan itu ("ISTQB Foundation Level", "Certified
 * Tester Agile") muncul di halaman publik. Begitu sertifikat contoh tidak lagi
 * diterbitkan — keadaan yang benar, karena pemiliknya tidak punya sertifikasi
 * itu — ketiga test jatuh. Yang dilaporkannya bukan cacat aplikasi, melainkan
 * bahwa data karangan sudah tidak tayang.
 *
 * Cakupan cabang komponen presentasional tidak semestinya bergantung pada isi
 * database produksi. Di sini fixture-nya dituliskan langsung, jadi kedua cabang
 * selalu dieksekusi apa pun isi situsnya — dan test ini tidak akan pernah lagi
 * menuntut pemiliknya menerbitkan sertifikat yang tidak dimilikinya.
 *
 * Yang menampilkan sertifikasi & edukasi NYATA dari database tetap diuji di
 * helpers/landing.ts, terhadap halaman sungguhan.
 */
const DENGAN_URL: Certification = {
  id: 'c-1',
  name: 'Sertifikat Dengan Kredensial',
  issuer: 'Penerbit A',
  year: 2022,
  credential_url: 'https://contoh.test/kredensial/abc',
}

const TANPA_URL: Certification = {
  id: 'c-2',
  name: 'Sertifikat Tanpa Kredensial',
  issuer: 'Penerbit B',
  year: 2023,
  credential_url: null,
}

const EDUKASI: Education = {
  id: 'e-1',
  institution: 'Universitas Contoh',
  degree: { id: 'Sarjana Sistem Informasi', en: "Bachelor's in Information Systems" },
  year: 2017,
}

describe('Certifications', () => {
  it('sertifikat dengan credential_url dibungkus tautan yang benar', () => {
    render(<Certifications certifications={[DENGAN_URL]} education={[]} locale="id" />)

    const tautan = screen.getByRole('link', { name: /Sertifikat Dengan Kredensial/ })
    expect(tautan).toHaveAttribute('href', 'https://contoh.test/kredensial/abc')
  })

  it('sertifikat tanpa credential_url tampil tapi TIDAK jadi tautan', () => {
    render(<Certifications certifications={[TANPA_URL]} education={[]} locale="id" />)

    // Kartunya harus tetap tampil...
    const judul = screen.getByRole('heading', { name: 'Sertifikat Tanpa Kredensial' })
    expect(judul).toBeInTheDocument()

    // ...dan TIDAK boleh dibungkus elemen <a> sama sekali.
    //
    // Diperiksa lewat closest('a'), BUKAN queryByRole('link'). Anchor tanpa
    // atribut href tidak punya role "link" di pohon aksesibilitas, sehingga
    // versi berbasis role LOLOS ketika cabangnya dilumpuhkan: kartu tanpa
    // credential_url dibungkus <a href={null}>, yang dirender sebagai <a>
    // tanpa href — kelihatan salah di HTML, tapi tak terlihat oleh role.
    // Dibuktikan dengan mutasi: mengganti syaratnya jadi `true` membuat SEMUA
    // kartu jadi anchor, dan versi lama test ini tetap hijau 6/6.
    expect(
      judul.closest('a'),
      'kartu tanpa credential_url dibungkus <a> — cabang penjaganya tidak jalan',
    ).toBeNull()
  })

  it('kedua cabang hidup berdampingan dalam satu render', () => {
    const { container } = render(
      <Certifications certifications={[DENGAN_URL, TANPA_URL]} education={[]} locale="id" />,
    )

    // Tepat satu anchor di seluruh section: milik kartu yang punya kredensial.
    expect(container.querySelectorAll('a')).toHaveLength(1)
    expect(
      screen.getByRole('heading', { name: 'Sertifikat Dengan Kredensial' }).closest('a'),
    ).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Sertifikat Tanpa Kredensial' }).closest('a'),
    ).toBeNull()
  })

  it('edukasi tampil bersama sertifikasi dalam satu bagian, memakai gelar sesuai bahasa', () => {
    const { container } = render(
      <Certifications certifications={[DENGAN_URL]} education={[EDUKASI]} locale="id" />,
    )

    // Institusi dirender sebagai `{institution} · {year}` — dua simpul teks
    // terpisah, jadi pencocokan simpul UTUH (getByText dengan string) meleset
    // walau teksnya jelas ada di layar. Yang diperiksa isi seluruh section.
    const isi = container.textContent ?? ''
    expect(isi).toContain('Universitas Contoh')
    expect(isi).toContain('2017')
    expect(isi).toContain('Sarjana Sistem Informasi')
    expect(isi).not.toContain("Bachelor's in Information Systems")
  })

  it('memakai gelar bahasa Inggris saat locale en', () => {
    const { container } = render(
      <Certifications certifications={[]} education={[EDUKASI]} locale="en" />,
    )

    const isi = container.textContent ?? ''
    expect(isi).toContain("Bachelor's in Information Systems")
    expect(isi).not.toContain('Sarjana Sistem Informasi')
  })

  it('tanpa sertifikasi maupun edukasi, section tidak dirender sama sekali', () => {
    const { container } = render(
      <Certifications certifications={[]} education={[]} locale="id" />,
    )
    expect(container.querySelector('#sertifikasi')).toBeNull()
  })
})
