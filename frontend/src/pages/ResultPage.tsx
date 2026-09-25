import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { DayDetailDialog } from '@/components/result/DayDetailDialog'
import { ResultCalendar } from '@/components/result/ResultCalendar'
import { ResultMonthSummary } from '@/components/result/ResultMonthSummary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BREAKEVEN_WIN_RATE } from '@/lib/constants'
import { buildMonthGrid, monthKeyFromDateKey, shiftMonth } from '@/lib/calendar'
import { todayKey } from '@/lib/date'
import { computeDailyMetrics, computeMonthlyMetrics } from '@/lib/metrics'
import { useTrades } from '@/hooks/useJournal'
import type { DailyMetrics, Trade } from '@/types/journal.types'

const WEEK_STARTS_ON = 1

export function ResultPage() {
  const tradesQuery = useTrades()
  const trades = useMemo(() => tradesQuery.data ?? [], [tradesQuery.data])
  const today = todayKey()

  const [monthKey, setMonthKey] = useState(() => monthKeyFromDateKey(today))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const metricsByDate = useMemo(() => {
    const byDate = new Map<string, Trade[]>()
    for (const trade of trades) {
      const key = trade.exitDate
      if (!key) continue
      const bucket = byDate.get(key)
      if (bucket) bucket.push(trade)
      else byDate.set(key, [trade])
    }
    const map = new Map<string, DailyMetrics>()
    for (const [date, group] of byDate) {
      map.set(date, computeDailyMetrics(date, group))
    }
    return map
  }, [trades])

  const cells = useMemo(
    () => buildMonthGrid(monthKey, metricsByDate, today, WEEK_STARTS_ON),
    [monthKey, metricsByDate, today],
  )

  const monthMetrics = useMemo(() => {
    const monthTrades = trades.filter((trade) => trade.month === monthKey)
    return computeMonthlyMetrics(monthKey, monthTrades)
  }, [trades, monthKey])

  const selectedTrades = useMemo(
    () =>
      selectedDate
        ? trades.filter((trade) => trade.exitDate === selectedDate)
        : [],
    [trades, selectedDate],
  )

  if (tradesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Result"
          description="Kalender performa trading harian."
        />
        <LoadingState variant="table" />
      </div>
    )
  }

  if (tradesQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Result"
          description="Kalender performa trading harian."
        />
        <ErrorState
          error={tradesQuery.error}
          onRetry={() => void tradesQuery.refetch()}
        />
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Result"
          description="Kalender performa trading harian."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Belum ada data trade</p>
              <p className="text-sm text-muted-foreground">
                Tambahkan trade untuk melihat result harian di kalender.
              </p>
            </div>
            <Button asChild>
              <Link to="/trades">Tambah Trade</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Result"
        description="Kalender performa trading harian."
      />

      <ResultMonthSummary
        metrics={monthMetrics}
        breakevenWinRate={BREAKEVEN_WIN_RATE}
      />

      <ResultCalendar
        monthKey={monthKey}
        cells={cells}
        weekStartsOn={WEEK_STARTS_ON}
        onPrevMonth={() => setMonthKey((current) => shiftMonth(current, -1))}
        onNextMonth={() => setMonthKey((current) => shiftMonth(current, 1))}
        onToday={() => setMonthKey(monthKeyFromDateKey(todayKey()))}
        onSelectDay={setSelectedDate}
      />

      <DayDetailDialog
        dateKey={selectedDate}
        trades={selectedTrades}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null)
        }}
      />
    </div>
  )
}
