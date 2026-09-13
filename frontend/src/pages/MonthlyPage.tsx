import { useMemo } from 'react'
import { Download } from 'lucide-react'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { MonthlyTable } from '@/components/monthly/MonthlyTable'
import { Button } from '@/components/ui/button'
import { computeMonthlySeries } from '@/lib/metrics'
import { useTrades } from '@/hooks/useJournal'

const CSV_HEADERS = [
  'Bulan',
  'Total Trade',
  'Wins',
  'Losses',
  'Break Even',
  'Win Rate (%)',
  'Net R',
  'Profit Factor',
  'EV',
  'Total P&L (USDT)',
  'Max Consec Loss',
  'Max Consec Win',
  'Avg R',
]

export function MonthlyPage() {
  const tradesQuery = useTrades()
  const trades = useMemo(() => tradesQuery.data ?? [], [tradesQuery.data])
  const series = useMemo(() => computeMonthlySeries(trades), [trades])

  function exportCsv() {
    const lines = [CSV_HEADERS.join(',')]
    for (const month of series) {
      lines.push(
        [
          month.month,
          month.totalTrades,
          month.wins,
          month.losses,
          month.breakEvens,
          month.winRate.toFixed(2),
          month.netR,
          Number.isFinite(month.profitFactor)
            ? month.profitFactor.toFixed(2)
            : 'Infinity',
          month.expectedValue.toFixed(3),
          month.totalPnl.toFixed(2),
          month.maxConsecutiveLoss,
          month.maxConsecutiveWin,
          month.avgRMultiple.toFixed(3),
        ].join(','),
      )
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'monthly-summary.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (tradesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Monthly Summary" description="Rekap semua metrik performa per bulan." />
        <LoadingState variant="table" />
      </div>
    )
  }

  if (tradesQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Monthly Summary" description="Rekap semua metrik performa per bulan." />
        <ErrorState error={tradesQuery.error} onRetry={() => void tradesQuery.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Summary"
        description="Rekap semua metrik performa per bulan."
        actions={
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={series.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <MonthlyTable series={series} />
    </div>
  )
}
