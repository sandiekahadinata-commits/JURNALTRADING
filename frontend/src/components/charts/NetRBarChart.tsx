import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatMonthLabel, formatR } from '@/lib/format'
import type { MonthlyMetrics } from '@/types/journal.types'

export function NetRBarChart({ data }: { data: MonthlyMetrics[] }) {
  const points = data.map((m) => ({
    label: formatMonthLabel(m.month, false),
    netR: Number(m.netR.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={points} margin={{ top: 12, right: 16, bottom: 0, left: -12 }}>
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
          tickFormatter={(value: number) => `${value}R`}
        />
        <Tooltip
          cursor={{ fill: 'hsl(217 33% 20% / 0.4)' }}
          contentStyle={{
            background: 'hsl(222 47% 8%)',
            border: '1px solid hsl(217 33% 18%)',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
          }}
          labelStyle={{ color: 'hsl(210 40% 98%)' }}
          formatter={(value) => [formatR(Number(value), { signed: true }), 'Net R']}
        />
        <ReferenceLine y={0} stroke="hsl(217 33% 30%)" />
        <Bar dataKey="netR" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {points.map((point, index) => (
            <Cell
              key={index}
              fill={point.netR >= 0 ? 'hsl(158 64% 45%)' : 'hsl(0 72% 51%)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
