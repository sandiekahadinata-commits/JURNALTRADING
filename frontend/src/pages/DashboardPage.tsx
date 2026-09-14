import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  DollarSign,
  Hash,
  Percent,
  Scale,
} from 'lucide-react'

import { BestWorstMonth } from '@/components/dashboard/BestWorstMonth'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { ImproveBreakdown } from '@/components/dashboard/ImproveBreakdown'
import { ImproveStatusBadge } from '@/components/dashboard/ImproveStatusBadge'
import { KpiCard, type KpiTone } from '@/components/dashboard/KpiCard'
import { LastTradesTable } from '@/components/dashboard/LastTradesTable'
import { StreakTracker } from '@/components/dashboard/StreakTracker'
import { WeeklyBreakdown } from '@/components/dashboard/WeeklyBreakdown'
import { WeeklyEvaluationCard } from '@/components/dashboard/WeeklyEvaluationCard'
import { WeeklyInsights } from '@/components/dashboard/WeeklyInsights'
import { DailyPnlBarChart } from '@/components/charts/DailyPnlBarChart'
import { NetRBarChart } from '@/components/charts/NetRBarChart'
import { PnlBarChart } from '@/components/charts/PnlBarChart'
import { WinRateTrendChart } from '@/components/charts/WinRateTrendChart'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BREAKEVEN_WIN_RATE } from '@/lib/constants'
import { todayKey } from '@/lib/date'
import {
  formatCurrency,
  formatDateID,
  formatDateRangeID,
  formatMonthLongID,
  formatPercent,
  formatProfitFactor,
  formatR,
} from '@/lib/format'
import { computeImproveStatus } from '@/lib/improve'
import {
  computeBestWorstMonth,
  computeMonthlyMetrics,
  computeStreaks,
  computeWeeklyEvaluation,
  getMonthKeys,
  getRecentDailySeries,
  getRecentMonthlySeries,
  groupTradesByMonth,
} from '@/lib/metrics'
import { useConfig, useTrades } from '@/hooks/useJournal'

function winRateTone(winRate: number): KpiTone {
  if (winRate > 33) return 'positive'
  if (winRate >= BREAKEVEN_WIN_RATE) return 'warning'
  return 'negative'
}

function profitFactorTone(pf: number): KpiTone {
  if (!Number.isFinite(pf)) return 'positive'
  if (pf > 1.5) return 'positive'
  if (pf >= 1) return 'warning'
  return 'negative'
}

export function DashboardPage() {
  const tradesQuery = useTrades()
  const configQuery = useConfig()

  const trades = useMemo(() => tradesQuery.data ?? [], [tradesQuery.data])
  const config = configQuery.data

  const derived = useMemo(() => {
    const groups = groupTradesByMonth(trades)
    const monthKeys = getMonthKeys(trades)
    const currentMonth = monthKeys[monthKeys.length - 1] ?? null
    const previousMonth = monthKeys[monthKeys.length - 2] ?? null

    const current = currentMonth
      ? computeMonthlyMetrics(currentMonth, groups.get(currentMonth) ?? [])
      : null
    const previous = previousMonth
      ? computeMonthlyMetrics(previousMonth, groups.get(previousMonth) ?? [])
      : null

    const today = todayKey()

    return {
      current,
      previous,
      series: getRecentMonthlySeries(trades),
      streaks: computeStreaks(trades),
      bestWorst: computeBestWorstMonth(trades),
      improve: computeImproveStatus(current, previous),
      weekly: computeWeeklyEvaluation(trades, today),
      daily: getRecentDailySeries(trades, 7, today),
    }
  }, [trades])

  if (tradesQuery.isLoading) {
    return <LoadingState />
  }

  if (tradesQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Ringkasan performa trading bulanan" />
        <ErrorState error={tradesQuery.error} onRetry={() => void tradesQuery.refetch()} />
      </div>
    )
  }

  if (trades.length === 0 || !derived.current) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Ringkasan performa trading bulanan"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Belum ada data trade</p>
              <p className="text-sm text-muted-foreground">
                Tambahkan trade pertama untuk melihat dashboard.
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

  const { current, previous, series, streaks, bestWorst, improve, weekly, daily } =
    derived
  const targetWinRate = config?.targetWinRate ?? 50

  const winRateDelta = previous ? current.winRate - previous.winRate : null
  const netRDelta = previous ? current.netR - previous.netR : null
  const pnlDelta = previous ? current.totalPnl - previous.totalPnl : null

  const todayEntry = daily[daily.length - 1]
  const yesterdayEntry = daily[daily.length - 2]
  const todayPnl = todayEntry?.totalPnl ?? 0
  const yesterdayPnl = yesterdayEntry?.totalPnl ?? 0
  const dayDelta = todayPnl - yesterdayPnl
  const dayDeltaTone: KpiTone =
    dayDelta > 0 ? 'positive' : dayDelta < 0 ? 'negative' : 'neutral'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Periode aktif: ${formatMonthLongID(current.month)}`}
        actions={<ImproveStatusBadge verdict={improve.verdict} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Win Rate Bulan Ini"
          value={formatPercent(current.winRate)}
          hint={
            winRateDelta === null
              ? 'Belum ada data bulan lalu'
              : `${winRateDelta >= 0 ? '+' : ''}${winRateDelta.toFixed(1)}% vs bulan lalu`
          }
          tone={winRateTone(current.winRate)}
          icon={Percent}
        />
        <KpiCard
          label="Net R Bulan Ini"
          value={formatR(current.netR, { signed: true })}
          hint={
            netRDelta === null
              ? 'Belum ada data bulan lalu'
              : `${netRDelta >= 0 ? '+' : ''}${netRDelta.toFixed(1)}R vs bulan lalu`
          }
          tone={current.netR >= 0 ? 'positive' : 'negative'}
          icon={BarChart3}
        />
        <KpiCard
          label="P&L Bulan Ini"
          value={formatCurrency(current.totalPnl, { signed: true })}
          hint={
            pnlDelta === null
              ? 'Belum ada data bulan lalu'
              : `${formatCurrency(pnlDelta, { signed: true })} vs bulan lalu`
          }
          tone={current.totalPnl >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
        />
        <KpiCard
          label="Jumlah Trade"
          value={`${current.totalTrades} trades`}
          hint={`${current.wins}W / ${current.losses}L / ${current.breakEvens}BE`}
          tone="neutral"
          icon={Hash}
        />
        <KpiCard
          label="Profit Factor"
          value={formatProfitFactor(current.profitFactor)}
          hint="Rasio gross profit / gross loss"
          tone={profitFactorTone(current.profitFactor)}
          icon={Scale}
        />
        <KpiCard
          label="Expected Value"
          value={formatR(current.expectedValue, { signed: true })}
          hint="EV per trade"
          tone={current.expectedValue >= 0 ? 'positive' : 'negative'}
          icon={Activity}
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Evaluasi Mingguan</h2>
          <span className="text-sm text-muted-foreground">
            {formatDateRangeID(weekly.startDate, weekly.endDate)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="P&L Hari Ini"
            value={formatCurrency(todayPnl, { signed: true })}
            hint={todayEntry ? formatDateID(todayEntry.date) : '-'}
            tone={todayPnl >= 0 ? 'positive' : 'negative'}
            icon={DollarSign}
          />
          <KpiCard
            label="P&L Kemarin"
            value={formatCurrency(yesterdayPnl, { signed: true })}
            hint={yesterdayEntry ? formatDateID(yesterdayEntry.date) : '-'}
            tone={yesterdayPnl >= 0 ? 'positive' : 'negative'}
            icon={DollarSign}
          />
          <KpiCard
            label="Perubahan vs Kemarin"
            value={formatCurrency(dayDelta, { signed: true })}
            hint="Selisih P&L harian"
            tone={dayDeltaTone}
            icon={Activity}
          />
        </div>

        <WeeklyEvaluationCard evaluation={weekly} />

        {weekly.metrics.totalTrades > 0 ? (
          <>
            <ChartCard
              title="P&L Harian (7 Hari Terakhir)"
              description="Keuntungan/kerugian per hari dalam USDT"
            >
              <DailyPnlBarChart data={daily} />
            </ChartCard>

            <WeeklyBreakdown breakdowns={weekly.breakdowns} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <StreakTracker streak={weekly.streaks} />
              <WeeklyInsights insights={weekly.insights} />
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Belum ada trade dalam 7 hari terakhir.
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Win Rate Trend"
          description="6 bulan terakhir dengan garis breakeven 25%"
        >
          <WinRateTrendChart
            data={series}
            targetWinRate={targetWinRate}
            breakevenWinRate={BREAKEVEN_WIN_RATE}
          />
        </ChartCard>
        <ChartCard title="Net R per Bulan" description="Positif = bulan hijau">
          <NetRBarChart data={series} />
        </ChartCard>
      </div>

      <ChartCard
        title="Total P&L per Bulan"
        description="Keuntungan/kerugian nyata dalam USDT"
      >
        <PnlBarChart data={series} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StreakTracker streak={streaks} />
        <BestWorstMonth data={bestWorst} />
        <ImproveBreakdown status={improve} />
      </div>

      <LastTradesTable trades={trades} />
    </div>
  )
}
