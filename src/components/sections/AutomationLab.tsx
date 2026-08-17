import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Wrap } from '@/components/ui/Wrap'
import type { LabScenario } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'
import { teks } from '@/lib/i18n/resolve'
import { LabRunner, type LabScenarioResolved } from './LabRunner'

const TEKS_UI: Record<
  Locale,
  {
    eyebrow: string
    judul: string
    intro: string
    catatan: string
    tombolJalankan: string
    tombolJalankanLagi: string
    progresPrefix: string
    totalTest: string
    passed: string
    failed: string
    durasi: string
    lihatReport: string
    tanpaLangkah: string
  }
> = {
  id: {
    eyebrow: 'Automation Lab',
    judul: 'Jalankan Sendiri Automation Saya',
    intro: 'Pilih framework, klik jalankan, lihat prosesnya sampai keluar report.',
    catatan: 'Rekaman replay dari eksekusi test asli, bukan simulasi karangan.',
    tombolJalankan: 'Jalankan Test',
    tombolJalankanLagi: 'Jalankan Lagi',
    progresPrefix: 'Langkah',
    totalTest: 'Total Test',
    passed: 'Passed',
    failed: 'Failed',
    durasi: 'Durasi',
    lihatReport: 'Lihat Report Lengkap',
    tanpaLangkah: 'Skenario ini belum memiliki langkah.',
  },
  en: {
    eyebrow: 'Automation Lab',
    judul: 'Run My Automation Yourself',
    intro: 'Pick a framework, click run, watch the process until the report comes out.',
    catatan: 'A replay of a real test execution, not a scripted simulation.',
    tombolJalankan: 'Run Test',
    tombolJalankanLagi: 'Run Again',
    progresPrefix: 'Step',
    totalTest: 'Total Test',
    passed: 'Passed',
    failed: 'Failed',
    durasi: 'Duration',
    lihatReport: 'View Full Report',
    tanpaLangkah: 'This scenario has no steps yet.',
  },
}

export function AutomationLab({
  labScenarios,
  locale,
}: {
  labScenarios: LabScenario[]
  locale: Locale
}) {
  if (labScenarios.length === 0) return null

  const ui = TEKS_UI[locale]

  // LabRunner adalah client component murni: seluruh teks diresolusi ke satu
  // bahasa di sini, sehingga teks()/Locale tidak perlu ikut ke bundel klien.
  const scenariosResolved: LabScenarioResolved[] = labScenarios.map((scenario) => ({
    id: scenario.id,
    frameworkName: scenario.framework_name,
    scenarioTitle: teks(scenario.scenario_title, locale),
    scenarioDescription: teks(scenario.scenario_description, locale),
    tags: scenario.tags,
    steps: scenario.steps.map((langkah) => ({
      label: teks(langkah.label, locale),
      durationMs: langkah.duration_ms,
    })),
    resultSummary: scenario.result_summary,
    fullReportUrl: scenario.full_report_url,
  }))

  return (
    <section id="automation-lab" className="py-[88px]">
      <Wrap>
        <Eyebrow>{ui.eyebrow}</Eyebrow>
        <SectionHeading judul={ui.judul} intro={ui.intro} />

        <div className="mb-8 flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 font-mono text-xs text-ink-faint">
          {ui.catatan}
        </div>

        <LabRunner
          scenarios={scenariosResolved}
          labels={{
            tombolJalankan: ui.tombolJalankan,
            tombolJalankanLagi: ui.tombolJalankanLagi,
            progresPrefix: ui.progresPrefix,
            totalTest: ui.totalTest,
            passed: ui.passed,
            failed: ui.failed,
            durasi: ui.durasi,
            lihatReport: ui.lihatReport,
            tanpaLangkah: ui.tanpaLangkah,
          }}
        />
      </Wrap>
    </section>
  )
}
