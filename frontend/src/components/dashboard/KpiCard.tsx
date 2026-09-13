import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type KpiTone = 'positive' | 'negative' | 'neutral' | 'warning'

const TONE_STYLES: Record<KpiTone, { value: string; icon: string }> = {
  positive: { value: 'text-emerald-400', icon: 'bg-emerald-500/15 text-emerald-400' },
  negative: { value: 'text-red-400', icon: 'bg-red-500/15 text-red-400' },
  warning: { value: 'text-amber-400', icon: 'bg-amber-500/15 text-amber-400' },
  neutral: { value: 'text-sky-400', icon: 'bg-sky-500/15 text-sky-400' },
}

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  tone?: KpiTone
  icon: LucideIcon
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon: Icon,
}: KpiCardProps) {
  const styles = TONE_STYLES[tone]
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn('truncate text-2xl font-semibold tabular-nums', styles.value)}>
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            styles.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}
