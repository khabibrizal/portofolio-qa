import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type {
  Certification,
  Education,
  Experience,
  Hero,
  About,
  SiteSettings,
  SkillCategory,
} from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'

/**
 * CV dalam format PDF, di-generate dari database.
 *
 * Alasan di-generate, bukan diunggah: begitu pengalaman diperbarui di admin,
 * CV-nya ikut berubah. Versi unggah membuat situs dan CV menyimpang diam-diam
 * — dan yang paling sering terjadi adalah CV yang tertinggal.
 *
 * TATA LETAK: SATU KOLOM YANG DITUMPUK, bukan sidebar + isi.
 *
 * Versi pertama meniru CV asli pemilik: sidebar abu 36% di kiri memuat profil,
 * pendidikan, keahlian, dan kontak. Dua hal rusak karenanya, dan keduanya
 * bawaan bentuk itu — bukan salah setelan yang bisa ditambal:
 *
 * 1. Paragraf profil di kolom 36% hanya memuat sekitar 35 karakter per baris.
 *    Dengan `textAlign: justify` sisa ruang tiap baris dibagi ke sela
 *    antarkata, sehingga barisnya melebar tak beraturan dan kata dipotong tanda
 *    hubung ("experi-ence", "in-dustries"). Melebarkan kolomnya mengecilkan
 *    kolom pengalaman; mengganti ke rata kiri hanya menyamarkan gejalanya.
 *    Yang benar: paragraf sepanjang itu butuh lebar penuh.
 *
 * 2. @react-pdf melanjutkan KEDUA kolom saat isinya melewati satu halaman, dan
 *    tiap kolom pindah halaman sendiri-sendiri. Akibatnya judul "SKILLS"
 *    tertinggal di dasar halaman 1 sementara butir pertamanya menyeberang ke
 *    halaman 2, dan latar abu sidebar tidak ikut menyambung.
 *
 * Menumpuk section secara vertikal menyelesaikan keduanya sekaligus: tiap
 * paragraf mendapat lebar penuh, dan pemenggalan halaman hanya perlu diatur
 * dalam satu arah. `wrap={false}` pada setiap blok utuh (satu pekerjaan, satu
 * kategori keahlian) memastikan tidak ada satuan yang terbelah di tengah, dan
 * `minPresenceAhead` menjaga judul section tidak tertinggal sendirian.
 *
 * Warnanya sengaja disalin dari token desain (`globals.css`) supaya CV dan
 * situsnya terasa satu sistem. Nilainya dituliskan di sini karena
 * @react-pdf/renderer tidak membaca CSS.
 */
export const WARNA = {
  sidebar: '#E8E8E8',
  ink: '#12181F',
  inkSoft: '#54606D',
  inkFaint: '#8A93A0',
  garis: '#C9CDD3',
  putih: '#FFFFFF',
  kepala: '#6E6E6E',
} as const

/**
 * Matikan pemenggalan kata.
 *
 * @react-pdf memenggal kata dengan tanda hubung secara bawaan. Pada CV itu
 * selalu merugikan: "experi-ence" membuat pembaca tersandung, dan istilah
 * teknis seperti "WebdriverIO" bisa terbelah di tempat yang tidak berarti
 * apa-apa. Mengembalikan kata sebagai satu bagian utuh mematikannya.
 */
Font.registerHyphenationCallback((kata) => [kata])

const gaya = StyleSheet.create({
  halaman: {
    paddingTop: 0,
    paddingBottom: 28,
    fontSize: 9,
    color: WARNA.ink,
    fontFamily: 'Helvetica',
  },

  // --- kepala ---
  kepala: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.sidebar,
    paddingVertical: 20,
    paddingHorizontal: 28,
    marginBottom: 18,
  },
  fotoBingkai: { width: 84, height: 84, borderRadius: 42, marginRight: 20, overflow: 'hidden' },
  foto: { width: 84, height: 84, objectFit: 'cover' },
  kepalaTeks: { flex: 1 },
  namaBesar: { fontSize: 24, lineHeight: 1.15, letterSpacing: 1, color: WARNA.ink },
  namaTebal: { fontSize: 24, lineHeight: 1.15, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, color: WARNA.ink },
  peran: { fontSize: 11, lineHeight: 1.3, color: WARNA.inkSoft, marginTop: 3, letterSpacing: 1 },

  // --- kerangka isi ---
  isi: { paddingHorizontal: 28 },
  judulSection: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    lineHeight: 1.3,
    marginBottom: 5,
    color: WARNA.ink,
  },
  garisJudul: { borderBottomWidth: 1, borderBottomColor: WARNA.garis, marginBottom: 8 },
  section: { marginBottom: 13 },

  // `fontSize` WAJIB ditulis di style yang sama dengan `lineHeight`.
  //
  // @react-pdf menghitung tinggi baris dari fontSize milik style ITU SENDIRI,
  // bukan dari yang diwarisi. Ukuran 9pt di style `halaman` memang menurun ke
  // glifnya, tapi perkalian lineHeight memakai bawaan pustaka — 18pt. Jadi
  // `lineHeight: 1.45` menghasilkan jarak baris 26pt untuk huruf 9pt: hampir
  // tiga kali yang dimaksud. Itulah sebab teks CV tampak renggang, dan sebab
  // isinya meluber sampai tiga halaman.
  //
  // Rata KIRI, bukan justify. Rata kanan-kiri membagi sisa ruang tiap baris ke
  // sela antarkata, dan itu membuat paragraf tampak renggang tak beraturan.
  paragraf: { fontSize: 9, lineHeight: 1.5, color: WARNA.ink, textAlign: 'left' },

  tebal: { fontSize: 9, lineHeight: 1.3, fontFamily: 'Helvetica-Bold' },
  periode: { fontSize: 8.5, lineHeight: 1.3, color: WARNA.inkSoft },
  butir: { flexDirection: 'row', marginBottom: 1.5 },
  bulat: { width: 9, fontSize: 9, lineHeight: 1.45 },
  isiButir: { flex: 1, fontSize: 9, lineHeight: 1.45 },

  // --- pengalaman ---
  barisPengalaman: {
    marginBottom: 11,
    paddingLeft: 11,
    borderLeftWidth: 1,
    borderLeftColor: WARNA.garis,
  },
  kepalaPengalaman: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  jabatan: { fontSize: 10, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4 },
  perusahaan: { fontSize: 9, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', color: WARNA.inkSoft, marginBottom: 4 },

  // --- kolom berdampingan ---
  baris: { flexDirection: 'row', flexWrap: 'wrap' },
  kolomDua: { width: '50%', paddingRight: 14, marginBottom: 8 },
  kolomTiga: { width: '33.33%', paddingRight: 14 },
  subJudul: { fontSize: 9, lineHeight: 1.3, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
})

const TEKS_UI: Record<Locale, Record<string, string>> = {
  id: {
    profil: 'PROFIL',
    pendidikan: 'PENDIDIKAN',
    keahlian: 'KEAHLIAN',
    sertifikasi: 'SERTIFIKASI',
    bahasa: 'BAHASA',
    kontak: 'KONTAK',
    pengalaman: 'PENGALAMAN',
    sekarang: 'Sekarang',
  },
  en: {
    profil: 'PROFILE',
    pendidikan: 'EDUCATION',
    keahlian: 'SKILLS',
    sertifikasi: 'CERTIFICATIONS',
    bahasa: 'LANGUAGES',
    kontak: 'CONTACT',
    pengalaman: 'EXPERIENCE',
    sekarang: 'Present',
  },
}

function tahun(tanggal: string | null, cadangan: string): string {
  if (!tanggal) return cadangan
  return new Date(tanggal).getFullYear().toString()
}

/**
 * Judul section beserta garisnya.
 *
 * TANPA `minPresenceAhead`. Prop itu semestinya menyisakan ruang di bawah judul
 * sebelum pemenggalan halaman diputuskan, dan sudah dicoba pada 56pt lalu
 * 120pt: judul "KEAHLIAN" tetap tercetak di dasar halaman 1 dengan isinya
 * menyeberang ke halaman 2, padahal sisa ruangnya hanya ~88pt. Karena tidak
 * terbukti berpengaruh, ia dihapus daripada dibiarkan sebagai setelan yang
 * terlihat mengatur sesuatu tapi sebenarnya mati.
 *
 * Yang dipakai sebagai gantinya adalah satu-satunya mekanisme yang memang
 * terbukti bekerja di sini: `wrap={false}` pada View yang memuat judul BESERTA
 * isinya, sehingga keduanya berpindah halaman bersama-sama.
 */
function JudulSection({ anak }: { anak: string }) {
  return (
    <View>
      <Text style={gaya.judulSection}>{anak}</Text>
      <View style={gaya.garisJudul} />
    </View>
  )
}

function Butir({ anak }: { anak: string }) {
  return (
    <View style={gaya.butir}>
      <Text style={gaya.bulat}>•</Text>
      <Text style={gaya.isiButir}>{anak}</Text>
    </View>
  )
}

export type DataCv = {
  settings: SiteSettings
  hero: Hero
  about: About | null
  skillCategories: SkillCategory[]
  experiences: Experience[]
  certifications: Certification[]
  education: Education[]
  fotoUrl: string | null
}

export function DokumenCv({ data, locale }: { data: DataCv; locale: Locale }) {
  const ui = TEKS_UI[locale]
  const { settings, hero, about, skillCategories, experiences, certifications, education } = data

  const namaDepan = hero.full_name.split(' ')[0]
  const namaSisa = hero.full_name.split(' ').slice(1).join(' ')

  return (
    <Document
      title={`CV — ${hero.full_name}`}
      author={hero.full_name}
      subject={teks(hero.role_title, locale)}
    >
      <Page size="A4" style={gaya.halaman}>
        {/* Kepala tidak boleh terbelah — foto yang terpisah dari namanya
            terlihat seperti berkas yang rusak. */}
        <View style={gaya.kepala} wrap={false}>
          {data.fotoUrl ? (
            <View style={gaya.fotoBingkai}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- Image @react-pdf tidak punya prop alt */}
              <Image src={data.fotoUrl} style={gaya.foto} />
            </View>
          ) : null}
          <View style={gaya.kepalaTeks}>
            <Text style={gaya.namaBesar}>{namaDepan}</Text>
            <Text style={gaya.namaTebal}>{namaSisa}</Text>
            <Text style={gaya.peran}>{teks(hero.role_title, locale)}</Text>
          </View>
        </View>

        <View style={gaya.isi}>
          {/* --- PROFIL, lebar penuh --- */}
          {about ? (
            <View style={gaya.section}>
              <JudulSection anak={ui.profil} />
              <Text style={gaya.paragraf}>{teks(about.about_richtext, locale)}</Text>
            </View>
          ) : null}

          {/* --- PENGALAMAN --- */}
          {experiences.length > 0 ? (
            <View style={gaya.section}>
              <JudulSection anak={ui.pengalaman} />
              {experiences.map((p) => (
                // Satu pekerjaan = satu satuan utuh. Jabatan yang terpisah dari
                // daftar tugasnya membuat pembaca kehilangan konteksnya.
                <View key={p.id} style={gaya.barisPengalaman} wrap={false}>
                  <View style={gaya.kepalaPengalaman}>
                    <Text style={gaya.jabatan}>{teks(p.role, locale).toUpperCase()}</Text>
                    <Text style={gaya.periode}>
                      {tahun(p.period_start, '')} – {tahun(p.period_end, ui.sekarang)}
                    </Text>
                  </View>
                  <Text style={gaya.perusahaan}>{teks(p.company, locale)}</Text>
                  {p.responsibilities.map((r, i) => (
                    <Butir key={`t-${i}`} anak={teks(r.text, locale)} />
                  ))}
                  {p.achievements.map((a, i) => (
                    <Butir key={`c-${i}`} anak={teks(a.text, locale)} />
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          {/* --- KEAHLIAN, dua kolom --- */}
          {/* Judul KEAHLIAN harus berpindah bersama kolomnya. Ukurannya
              terbatas (dua kategori, sekitar 165pt), jadi aman dijadikan satu
              satuan; kalau kategorinya kelak bertambah banyak sampai melewati
              satu halaman, blok ini yang harus dipecah per kategori. */}
          {skillCategories.length > 0 ? (
            <View style={gaya.section} wrap={false}>
              <JudulSection anak={ui.keahlian} />
              <View style={gaya.baris}>
                {skillCategories.map((k) => (
                  <View key={k.id} style={gaya.kolomDua} wrap={false}>
                    <Text style={gaya.subJudul}>{teks(k.category_name, locale)}</Text>
                    {k.skills.map((s) => (
                      <Butir key={s.name} anak={s.name} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* --- SERTIFIKASI --- */}
          {certifications.length > 0 ? (
            <View style={gaya.section} wrap={false}>
              <JudulSection anak={ui.sertifikasi} />
              <View style={gaya.baris}>
                {certifications.map((c) => (
                  <View key={c.id} style={gaya.kolomDua} wrap={false}>
                    <Text style={gaya.tebal}>{c.name}</Text>
                    <Text style={{ color: WARNA.inkSoft }}>
                      {c.issuer} · {c.year}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* --- PENDIDIKAN | BAHASA | KONTAK, tiga kolom sejajar ---
              Ketiganya pendek. Ditumpuk sendiri-sendiri mereka menyisakan ruang
              kosong lebar di kanan; disejajarkan, satu baris sudah cukup. */}
          <View style={gaya.baris}>
            {education.length > 0 ? (
              <View style={gaya.kolomTiga} wrap={false}>
                <JudulSection anak={ui.pendidikan} />
                {education.map((e) => (
                  <View key={e.id} style={{ marginBottom: 7 }}>
                    <Text style={gaya.periode}>{e.year}</Text>
                    <Text style={gaya.tebal}>{teks(e.degree, locale)}</Text>
                    <Text style={{ color: WARNA.inkSoft }}>{e.institution}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {settings.languages.length > 0 ? (
              <View style={gaya.kolomTiga} wrap={false}>
                <JudulSection anak={ui.bahasa} />
                {settings.languages.map((b) => (
                  <Butir key={b.name} anak={`${b.name} (${b.level})`} />
                ))}
              </View>
            ) : null}

            <View style={gaya.kolomTiga} wrap={false}>
              <JudulSection anak={ui.kontak} />
              {settings.location ? (
                <Text style={{ marginBottom: 2.5 }}>{settings.location}</Text>
              ) : null}
              {settings.whatsapp_number ? (
                <Text style={{ marginBottom: 2.5 }}>{settings.whatsapp_number}</Text>
              ) : null}
              <Text style={{ marginBottom: 2.5 }}>{settings.contact_email}</Text>
              {settings.linkedin_url ? (
                <Text style={{ marginBottom: 2.5 }}>
                  {settings.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
