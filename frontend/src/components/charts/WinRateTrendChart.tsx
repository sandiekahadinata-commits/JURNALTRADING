import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatMonthLabel, formatPercent } from '@/lib/format'
import type { MonthlyMetrics } from '@/types/journal.types'

interface WinRateTrendChartProps {
  data: MonthlyMetrics[]
  targetWinRate: number
  breakevenWinRate: number
}

export function WinRateTrendChart({
  data,
  targetWinRate,
  breakevenWinRate,
}: WinRateTrendChartProps) {
  const points = data.map((m) => ({
    label: formatMonthLabel(m.month, false),
    winRate: Number(m.winRate.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={points} margin={{ top: 12, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 16%)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="hsl(215 20% 55%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(215 20% 55%)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(222 47% 8%)',
            border: '1px solid hsl(217 33% 18%)',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
          }}
          labelStyle={{ color: 'hsl(210 40% 98%)' }}
          formatter={(value) => [formatPercent(Number(value)), 'Win Rate']}
        />
        <ReferenceLine
          y={breakevenWinRate}
          stroke="hsl(0 72% 51%)"
          strokeDasharray="4 4"
          label={{
            value: `BE ${breakevenWinRate}%`,
            position: 'insideBottomLeft',
            fill: 'hsl(0 72% 60%)',
            fontSize: 11,
          }}
        />
        <ReferenceLine
          y={targetWinRate}
          stroke="hsl(43 96% 56%)"
          strokeDasharray="4 4"
          label={{
            value: `Target ${targetWinRate}%`,
            position: 'insideTopLeft',
            fill: 'hsl(43 96% 60%)',
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="winRate"
          stroke="hsl(158 64% 50%)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: 'hsl(158 64% 50%)' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
