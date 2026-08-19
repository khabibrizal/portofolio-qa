import {
  Document,
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
 * Tata letaknya mengikuti CV yang sudah dipakai pemilik: sidebar abu di kiri
 * (foto, profil, pendidikan, keahlian, tools, bahasa, kontak) dan timeline
 * pengalaman di kanan.
 *
 * Alasan di-generate, bukan diunggah: begitu pengalaman diperbarui di admin,
 * CV-nya ikut berubah. Versi unggah membuat situs dan CV menyimpang diam-diam
 * — dan yang paling sering terjadi adalah CV yang tertinggal.
 *
 * Warnanya sengaja disalin dari token desain (`globals.css`) supaya CV dan
 * situsnya terasa satu sistem. Nilainya dituliskan di sini karena
 * @react-pdf/renderer tidak membaca CSS; ini satu-satunya tempat di luar
 * globals.css yang boleh memuat hex, dan dikunci test.
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

const gaya = StyleSheet.create({
  halaman: { flexDirection: 'row', fontSize: 9, color: WARNA.ink, fontFamily: 'Helvetica' },

  sisi: { width: '36%', backgroundColor: WARNA.sidebar, paddingVertical: 24, paddingHorizontal: 20 },
  utama: { width: '64%', paddingVertical: 24, paddingHorizontal: 22 },

  fotoBingkai: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  foto: { width: 120, height: 120, objectFit: 'cover' },

  judulSisi: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    color: WARNA.ink,
  },
  garisJudul: { borderBottomWidth: 1, borderBottomColor: WARNA.garis, marginBottom: 8 },

  periode: { fontSize: 8, color: WARNA.inkSoft, marginTop: 6 },
  tebal: { fontFamily: 'Helvetica-Bold' },
  butir: { flexDirection: 'row', marginBottom: 3 },
  bulat: { width: 8, fontSize: 9 },
  isiButir: { flex: 1, lineHeight: 1.35 },

  namaBesar: { fontSize: 26, letterSpacing: 1, color: WARNA.ink, textAlign: 'right' },
  namaTebal: { fontSize: 26, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textAlign: 'right' },
  peran: { fontSize: 11, color: WARNA.inkSoft, textAlign: 'right', marginTop: 4, letterSpacing: 1 },

  judulUtama: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 6,
  },
  paragraf: { lineHeight: 1.45, color: WARNA.ink, textAlign: 'justify' },

  barisPengalaman: { marginBottom: 14, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: WARNA.garis },
  kepalaPengalaman: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  jabatan: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  perusahaan: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
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

function JudulSisi({ anak }: { anak: string }) {
  return (
    <>
      <Text style={gaya.judulSisi}>{anak}</Text>
      <View style={gaya.garisJudul} />
    </>
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

  return (
    <Document
      title={`CV — ${hero.full_name}`}
      author={hero.full_name}
      subject={teks(hero.role_title, locale)}
    >
      <Page size="A4" style={gaya.halaman}>
        <View style={gaya.sisi}>
          {data.fotoUrl ? (
            <View style={gaya.fotoBingkai}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- Image @react-pdf tidak punya prop alt */}
              <Image src={data.fotoUrl} style={gaya.foto} />
            </View>
          ) : null}

          {about ? (
            <>
              <JudulSisi anak={ui.profil} />
              <Text style={gaya.paragraf}>{teks(about.about_richtext, locale)}</Text>
            </>
          ) : null}

          {education.length > 0 ? (
            <>
              <JudulSisi anak={ui.pendidikan} />
              {education.map((e) => (
                <View key={e.id} style={{ marginBottom: 8 }}>
                  <Text style={gaya.periode}>{e.year}</Text>
                  <Text style={gaya.tebal}>{teks(e.degree, locale)}</Text>
                  <Text>{e.institution}</Text>
                </View>
              ))}
            </>
          ) : null}

          {skillCategories.length > 0 ? (
            <>
              <JudulSisi anak={ui.keahlian} />
              {skillCategories.map((k) => (
                <View key={k.id} style={{ marginBottom: 8 }}>
                  <Text style={[gaya.tebal, { marginBottom: 3 }]}>
                    {teks(k.category_name, locale)}
                  </Text>
                  {k.skills.map((s) => (
                    <Butir key={s.name} anak={s.name} />
                  ))}
                </View>
              ))}
            </>
          ) : null}

          {certifications.length > 0 ? (
            <>
              <JudulSisi anak={ui.sertifikasi} />
              {certifications.map((c) => (
                <View key={c.id} style={{ marginBottom: 5 }}>
                  <Text style={gaya.tebal}>{c.name}</Text>
                  <Text style={{ color: WARNA.inkSoft }}>
                    {c.issuer} · {c.year}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {settings.languages.length > 0 ? (
            <>
              <JudulSisi anak={ui.bahasa} />
              {settings.languages.map((b) => (
                <Butir key={b.name} anak={`${b.name} (${b.level})`} />
              ))}
            </>
          ) : null}

          <JudulSisi anak={ui.kontak} />
          {settings.location ? <Text style={{ marginBottom: 3 }}>{settings.location}</Text> : null}
          {settings.whatsapp_number ? (
            <Text style={{ marginBottom: 3 }}>{settings.whatsapp_number}</Text>
          ) : null}
          <Text style={{ marginBottom: 3 }}>{settings.contact_email}</Text>
          {settings.linkedin_url ? (
            <Text style={{ marginBottom: 3 }}>
              {settings.linkedin_url.replace(/^https?:\/\/(www\.)?/, '')}
            </Text>
          ) : null}
        </View>

        <View style={gaya.utama}>
          <Text style={gaya.namaBesar}>{hero.full_name.split(' ')[0]}</Text>
          <Text style={gaya.namaTebal}>{hero.full_name.split(' ').slice(1).join(' ')}</Text>
          <Text style={gaya.peran}>{teks(hero.role_title, locale)}</Text>

          <Text style={gaya.judulUtama}>{ui.pengalaman}</Text>
          <View style={gaya.garisJudul} />

          {experiences.map((p) => (
            <View key={p.id} style={gaya.barisPengalaman}>
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
      </Page>
    </Document>
  )
}
