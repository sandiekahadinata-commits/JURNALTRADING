import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { CalendarCell } from '@/lib/calendar'

type DayTone = 'positive' | 'negative' | 'flat' | 'empty'

const CARD_STYLES: Record<DayTone, string> = {
  positive:
    'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20',
  negative: 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20',
  flat: 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20',
  empty: 'border-border/60 bg-card/40 hover:bg-accent',
}

const VALUE_STYLES: Record<DayTone, string> = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  flat: 'text-amber-400',
  empty: 'text-muted-foreground',
}

interface DayBentoCardProps {
  cell: CalendarCell
  onSelect: (dateKey: string) => void
}

export function DayBentoCard({ cell, onSelect }: DayBentoCardProps) {
  const { metrics, inMonth, isToday, dayNumber, dateKey } = cell
  const hasTrades = Boolean(metrics && metrics.totalTrades > 0)
  const pnl = metrics?.totalPnl ?? 0

  const tone: DayTone = !hasTrades
    ? 'empty'
    : pnl > 0
      ? 'positive'
      : pnl < 0
        ? 'negative'
        : 'flat'

  return (
    <button
      type="button"
      onClick={() => onSelect(dateKey)}
      aria-label={`Detail trade ${dateKey}`}
      className={cn(
        'flex min-h-[104px] w-full flex-col rounded-xl border p-2 text-left transition-colors',
        CARD_STYLES[tone],
        !inMonth && 'opacity-40',
        isToday && 'ring-1 ring-primary ring-offset-1 ring-offset-background',
      )}
    >
      <span
        className={cn(
          'text-xs font-semibold tabular-nums',
          inMonth ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {dayNumber}
      </span>

      <div className="mt-auto space-y-0.5">
        {hasTrades && metrics ? (
          <>
            <p
              className={cn(
                'truncate text-sm font-semibold tabular-nums',
                VALUE_STYLES[tone],
              )}
              title={formatCurrency(pnl, { signed: true })}
            >
              {formatCurrency(pnl, { signed: true })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {metrics.totalTrades} trades
            </p>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              <span className="text-emerald-400">{metrics.wins}W</span>
              {' / '}
              <span className="text-red-400">{metrics.losses}L</span>
              {' / '}
              <span className="text-amber-400">{metrics.breakEvens}BE</span>
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">—</p>
        )}
      </div>
    </button>
  )
}
