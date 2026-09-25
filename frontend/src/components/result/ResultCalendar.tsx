import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DayBentoCard } from '@/components/result/DayBentoCard'
import { formatMonthLongID } from '@/lib/format'
import type { CalendarCell } from '@/lib/calendar'

const WEEKDAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface ResultCalendarProps {
  monthKey: string
  cells: CalendarCell[]
  weekStartsOn?: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onSelectDay: (dateKey: string) => void
}

export function ResultCalendar({
  monthKey,
  cells,
  weekStartsOn = 1,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDay,
}: ResultCalendarProps) {
  const labels = Array.from(
    { length: 7 },
    (_, i) => WEEKDAY_LABELS[(weekStartsOn + i) % 7],
  )

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{formatMonthLongID(monthKey)}</h2>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={onToday}>
            Hari Ini
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevMonth}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextMonth}
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {labels.map((label) => (
              <div
                key={label}
                className="px-1 pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {cells.map((cell) => (
              <DayBentoCard
                key={cell.dateKey}
                cell={cell}
                onSelect={onSelectDay}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
