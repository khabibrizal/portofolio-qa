import { Wrap } from '@/components/ui/Wrap'
import type { Tool } from '@/lib/content/types'
import type { Locale } from '@/lib/i18n/locales'

const LABEL_TRUST: Record<Locale, string> = {
  id: 'TOOLS & PLATFORM YANG DIGUNAKAN',
  en: 'TOOLS & PLATFORMS I USE',
}

export function TrustStrip({ tools, locale }: { tools: Tool[]; locale: Locale }) {
  if (tools.length === 0) return null

  return (
    <div className="border-y border-border bg-surface py-9">
      <Wrap className="flex flex-wrap items-center justify-between gap-5">
        <span className="whitespace-nowrap font-mono text-xs tracking-[0.08em] text-ink-faint">
          {LABEL_TRUST[locale]}
        </span>
        <div className="flex flex-wrap gap-8">
          {tools.map((tool) => (
            <span key={tool.id} className="font-display text-[15px] font-semibold text-ink-faint">
              {tool.name}
            </span>
          ))}
        </div>
      </Wrap>
    </div>
  )
}
