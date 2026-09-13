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
import { NetRBarChart } from '@/components/charts/NetRBarChart'
import { PnlBarChart } from '@/components/charts/PnlBarChart'
import { WinRateTrendChart } from '@/components/charts/WinRateTrendChart'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BREAKEVEN_WIN_RATE } from '@/lib/constants'
import {
  formatCurrency,
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
  getMonthKeys,
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

    return {
      current,
      previous,
      series: getRecentMonthlySeries(trades),
      streaks: computeStreaks(trades),
      bestWorst: computeBestWorstMonth(trades),
      improve: computeImproveStatus(current, previous),
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

  const { current, previous, series, streaks, bestWorst, improve } = derived
  const targetWinRate = config?.targetWinRate ?? 50

  const winRateDelta = previous ? current.winRate - previous.winRate : null
  const netRDelta = previous ? current.netR - previous.netR : null
  const pnlDelta = previous ? current.totalPnl - previous.totalPnl : null

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
