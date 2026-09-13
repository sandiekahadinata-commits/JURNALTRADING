import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { TradeFilters, DEFAULT_TRADE_FILTERS, type TradeFilterState } from '@/components/trades/TradeFilters'
import { TradeFormDialog } from '@/components/trades/TradeFormDialog'
import { TradeTable } from '@/components/trades/TradeTable'
import { Button } from '@/components/ui/button'
import { DEFAULT_SETUP_TAGS } from '@/lib/constants'
import { formatCurrency } from '@/lib/format'
import { getMonthKeys } from '@/lib/metrics'
import { sortTradesByExitDesc, type TradeInput } from '@/lib/trade-utils'
import {
  useConfig,
  useCreateTrade,
  useDeleteTrade,
  useTrades,
  useUpdateTrade,
} from '@/hooks/useJournal'
import type { Trade } from '@/types/journal.types'

export function TradeLogPage() {
  const tradesQuery = useTrades()
  const configQuery = useConfig()
  const createTrade = useCreateTrade()
  const updateTrade = useUpdateTrade()
  const deleteTrade = useDeleteTrade()

  const [filters, setFilters] = useState<TradeFilterState>(DEFAULT_TRADE_FILTERS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Trade | null>(null)

  const trades = useMemo(() => tradesQuery.data ?? [], [tradesQuery.data])

  const months = useMemo(() => getMonthKeys(trades).reverse(), [trades])
  const symbols = useMemo(
    () => [...new Set(trades.map((t) => t.symbol))].sort(),
    [trades],
  )

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()
    return sortTradesByExitDesc(
      trades.filter((trade) => {
        if (filters.month !== 'all' && trade.month !== filters.month) return false
        if (filters.symbol !== 'all' && trade.symbol !== filters.symbol)
          return false
        if (filters.result !== 'all' && trade.result !== filters.result)
          return false
        if (search) {
          const haystack = `${trade.symbol} ${trade.setupTag ?? ''} ${trade.notes ?? ''}`.toLowerCase()
          if (!haystack.includes(search)) return false
        }
        return true
      }),
    )
  }, [trades, filters])

  const filteredPnl = filtered.reduce((sum, t) => sum + t.pnl, 0)

  function handleAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  function handleEdit(trade: Trade) {
    setEditing(trade)
    setDialogOpen(true)
  }

  async function handleSubmit(input: TradeInput) {
    if (editing) {
      await updateTrade.mutateAsync({ id: editing.id, input })
    } else {
      await createTrade.mutateAsync(input)
    }
  }

  if (tradesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Trade Log" description="Catat dan kelola semua trade yang sudah closed." />
        <LoadingState variant="table" />
      </div>
    )
  }

  if (tradesQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Trade Log" description="Catat dan kelola semua trade yang sudah closed." />
        <ErrorState error={tradesQuery.error} onRetry={() => void tradesQuery.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trade Log"
        description="Catat dan kelola semua trade yang sudah closed."
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Tambah Trade
          </Button>
        }
      />

      <TradeFilters
        months={months}
        symbols={symbols}
        value={filters}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          Menampilkan <span className="font-medium text-foreground">{filtered.length}</span> dari{' '}
          {trades.length} trade
        </span>
        <span>
          P&L terfilter:{' '}
          <span
            className={
              filteredPnl >= 0 ? 'font-medium text-emerald-400' : 'font-medium text-red-400'
            }
          >
            {formatCurrency(filteredPnl, { signed: true })}
          </span>
        </span>
      </div>

      {deleteTrade.isError ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          Gagal menghapus trade: {deleteTrade.error?.message}
        </p>
      ) : null}

      <TradeTable
        trades={filtered}
        onEdit={handleEdit}
        onDelete={(id) => deleteTrade.mutate(id)}
      />

      <TradeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trade={editing}
        setupTags={configQuery.data?.setupTags ?? DEFAULT_SETUP_TAGS}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
