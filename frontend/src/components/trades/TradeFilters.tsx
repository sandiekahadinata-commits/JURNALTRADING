import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TRADE_RESULTS } from '@/lib/constants'
import { formatMonthLabel } from '@/lib/format'

export interface TradeFilterState {
  month: string
  symbol: string
  result: string
  search: string
}

export const DEFAULT_TRADE_FILTERS: TradeFilterState = {
  month: 'all',
  symbol: 'all',
  result: 'all',
  search: '',
}

interface TradeFiltersProps {
  months: string[]
  symbols: string[]
  value: TradeFilterState
  onChange: (value: TradeFilterState) => void
}

export function TradeFilters({
  months,
  symbols,
  value,
  onChange,
}: TradeFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari symbol / catatan..."
          className="pl-9"
          value={value.search}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value })
          }
        />
      </div>

      <Select
        value={value.month}
        onValueChange={(month) => onChange({ ...value, month })}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Bulan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Bulan</SelectItem>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {formatMonthLabel(month)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.symbol}
        onValueChange={(symbol) => onChange({ ...value, symbol })}
      >
        <SelectTrigger className="w-full sm:w-[170px]">
          <SelectValue placeholder="Symbol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Symbol</SelectItem>
          {symbols.map((symbol) => (
            <SelectItem key={symbol} value={symbol}>
              {symbol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.result}
        onValueChange={(result) => onChange({ ...value, result })}
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Hasil" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Hasil</SelectItem>
          {TRADE_RESULTS.map((result) => (
            <SelectItem key={result} value={result}>
              {result}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
