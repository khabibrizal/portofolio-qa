'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * LabRunner tidak tahu apa pun soal i18n — seluruh teks yang ia terima
 * (judul, deskripsi, tag, label langkah, label UI) sudah diresolusi ke satu
 * bahasa oleh AutomationLab (server component). Ini mencegah teks()/Locale
 * ikut masuk ke bundel klien.
 */
export type LangkahLabResolved = { label: string; durationMs: number }

export type RingkasanLabResolved = {
  total: number
  passed: number
  failed: number
  duration: string
}

export type LabScenarioResolved = {
  id: string
  frameworkName: string
  scenarioTitle: string
  scenarioDescription: string
  tags: string[]
  steps: LangkahLabResolved[]
  resultSummary: RingkasanLabResolved | null
  fullReportUrl: string | null
}

export type LabRunnerLabels = {
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

type StatusLangkah = 'idle' | 'berjalan' | 'selesai'

type RunState = {
  steps: StatusLangkah[]
  running: boolean
  finished: boolean
  pernahSelesai: boolean
}

function runStateAwal(scenario: LabScenarioResolved): RunState {
  return {
    steps: scenario.steps.map(() => 'idle'),
    running: false,
    finished: false,
    pernahSelesai: false,
  }
}

export function LabRunner({
  scenarios,
  labels,
}: {
  scenarios: LabScenarioResolved[]
  labels: LabRunnerLabels
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [runStates, setRunStates] = useState<RunState[]>(() => scenarios.map(runStateAwal))
  // Inisialisasi lazy — dibaca langsung di klien, bukan lewat setState di
  // dalam efek (menghindari render tambahan tanpa perlu).
  const [gerakDikurangi, setGerakDikurangi] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setGerakDikurangi(e.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  // Bersihkan timer yang masih tertunda saat komponen dilepas — timer yang
  // menembak setelah unmount adalah kebocoran yang muncul sebagai error acak.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function bersihkanTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function pilihTab(index: number) {
    if (index === activeIndex) return

    // Skenario yang ditinggalkan di tengah replay direset ke keadaan awal:
    // membiarkan indikatornya "berjalan" tanpa timer yang menjalankannya
    // akan membekukan tampilan itu selamanya.
    bersihkanTimer()
    setRunStates((prev) =>
      prev.map((state, i) => (i === activeIndex && state.running ? runStateAwal(scenarios[i]) : state)),
    )
    setActiveIndex(index)
  }

  function jalankanUlang(index: number) {
    const scenario = scenarios[index]
    bersihkanTimer()

    if (scenario.steps.length === 0) {
      setRunStates((prev) =>
        prev.map((state, i) =>
          i === index ? { steps: [], running: false, finished: true, pernahSelesai: true } : state,
        ),
      )
      return
    }

    if (gerakDikurangi) {
      // Tanpa animasi: seluruh langkah dan report langsung tampil final.
      setRunStates((prev) =>
        prev.map((state, i) =>
          i === index
            ? {
                steps: scenario.steps.map(() => 'selesai'),
                running: false,
                finished: true,
                pernahSelesai: true,
              }
            : state,
        ),
      )
      return
    }

    setRunStates((prev) =>
      prev.map((state, i) =>
        i === index
          ? {
              steps: scenario.steps.map((_, si) => (si === 0 ? 'berjalan' : 'idle')),
              running: true,
              finished: false,
              pernahSelesai: state.pernahSelesai,
            }
          : state,
      ),
    )

    const jalankanLangkah = (langkahIndex: number) => {
      const durasi = scenario.steps[langkahIndex].durationMs
      timeoutRef.current = setTimeout(() => {
        const langkahBerikut = langkahIndex + 1
        const selesaiSemua = langkahBerikut >= scenario.steps.length

        setRunStates((prev) =>
          prev.map((state, i) => {
            if (i !== index) return state
            const steps = state.steps.map((status, si) => {
              if (si === langkahIndex) return 'selesai' as const
              if (si === langkahBerikut) return 'berjalan' as const
              return status
            })
            return {
              steps,
              running: !selesaiSemua,
              finished: selesaiSemua,
              pernahSelesai: state.pernahSelesai || selesaiSemua,
            }
          }),
        )

        if (!selesaiSemua) jalankanLangkah(langkahBerikut)
      }, durasi)
    }

    jalankanLangkah(0)
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {scenarios.map((scenario, i) => (
          <button
            key={scenario.id}
            type="button"
            role="tab"
            id={`lab-tab-${scenario.id}`}
            aria-selected={i === activeIndex}
            aria-controls={`lab-panel-${scenario.id}`}
            onClick={() => pilihTab(i)}
            className={
              i === activeIndex
                ? 'rounded-lg border border-primary bg-primary px-[18px] py-2.5 font-mono text-[13px] font-medium text-white'
                : 'rounded-lg border border-border bg-surface px-[18px] py-2.5 font-mono text-[13px] font-medium text-ink-soft hover:text-primary'
            }
          >
            {scenario.frameworkName}
          </button>
        ))}
      </div>

      {scenarios.map((scenario, i) => {
        const runState = runStates[i]
        const totalLangkah = scenario.steps.length
        const indeksBerjalan = runState.steps.findIndex((s) => s === 'berjalan')

        return (
          <div
            key={scenario.id}
            id={`lab-panel-${scenario.id}`}
            role="tabpanel"
            aria-labelledby={`lab-tab-${scenario.id}`}
            className={
              i === activeIndex
                ? 'rounded-[14px] border border-border bg-surface p-[30px]'
                : 'hidden'
            }
          >
            <div className="mb-[22px] flex flex-wrap items-start justify-between gap-5">
              <div>
                <h3 className="mb-1.5 font-display text-[19px] font-bold">
                  {scenario.scenarioTitle}
                </h3>
                <p className="max-w-[480px] text-[14.5px] text-ink-soft">
                  {scenario.scenarioDescription}
                </p>
                {scenario.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {scenario.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-[5px] border border-border bg-bg px-2.5 py-1 font-mono text-[11px] text-ink-soft"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => jalankanUlang(i)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-[14.5px] font-semibold text-white"
              >
                {runState.pernahSelesai ? labels.tombolJalankanLagi : labels.tombolJalankan}
              </button>
            </div>

            {runState.running && totalLangkah > 0 ? (
              <p className="mb-2.5 font-mono text-[11.5px] text-ink-faint">
                {labels.progresPrefix} {(indeksBerjalan === -1 ? totalLangkah : indeksBerjalan + 1)}/
                {totalLangkah}
              </p>
            ) : null}

            <div className="min-h-16 rounded-[10px] bg-primary-dark p-5">
              {totalLangkah === 0 ? (
                <p className="py-3.5 text-center font-mono text-[13px] text-white/40">
                  {labels.tanpaLangkah}
                </p>
              ) : (
                scenario.steps.map((langkah, si) => {
                  const status = runState.steps[si]
                  return (
                    <div
                      key={si}
                      className={`flex items-center gap-3 border-b border-dashed border-white/10 py-2 font-mono text-[13.5px] text-white/90 last:border-b-0 ${
                        status === 'idle' ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <span
                        className={
                          status === 'selesai' ? 'font-semibold text-pass' : 'font-semibold text-white/30'
                        }
                        aria-hidden
                      >
                        {status === 'selesai' ? '✓' : '…'}
                      </span>
                      <b className="font-semibold">{langkah.label}</b>
                      <span className="ml-auto text-[12px] text-white/40">
                        {status === 'selesai' ? 'PASS' : status === 'berjalan' ? '...' : ''}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {runState.finished && scenario.resultSummary ? (
              <div className="mt-5 border-t border-border pt-5">
                <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-bg p-3.5 text-center">
                    <b className="block font-display text-xl">{scenario.resultSummary.total}</b>
                    <span className="text-[11px] text-ink-faint">{labels.totalTest}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-bg p-3.5 text-center">
                    <b className="block font-display text-xl text-pass">
                      {scenario.resultSummary.passed}
                    </b>
                    <span className="text-[11px] text-ink-faint">{labels.passed}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-bg p-3.5 text-center">
                    <b className="block font-display text-xl">{scenario.resultSummary.failed}</b>
                    <span className="text-[11px] text-ink-faint">{labels.failed}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-bg p-3.5 text-center">
                    <b className="block font-display text-xl">{scenario.resultSummary.duration}</b>
                    <span className="text-[11px] text-ink-faint">{labels.durasi}</span>
                  </div>
                </div>
                {scenario.fullReportUrl ? (
                  <a
                    href={scenario.fullReportUrl}
                    className="inline-flex items-center gap-2 rounded-lg border-[1.5px] border-border bg-surface px-6 py-3.5 text-[14.5px] font-semibold text-ink"
                  >
                    {labels.lihatReport}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
