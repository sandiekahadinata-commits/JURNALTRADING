import { Flame, Snowflake } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { StreakInfo } from '@/lib/metrics'

export function StreakTracker({ streak }: { streak: StreakInfo }) {
  const isWin = streak.type === 'Win'
  const isLoss = streak.type === 'Loss'
  const Icon = isWin ? Flame : Snowflake

  const currentLabel =
    streak.type === 'None'
      ? 'Tidak ada streak aktif'
      : `${streak.count}x ${streak.type} berurutan`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Streak Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3',
            isWin && 'border-emerald-500/30 bg-emerald-500/10',
            isLoss && 'border-red-500/30 bg-red-500/10',
            !isWin && !isLoss && 'border-border bg-secondary/40',
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              isWin && 'text-emerald-400',
              isLoss && 'text-red-400',
              !isWin && !isLoss && 'text-muted-foreground',
            )}
          />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Streak Saat Ini
            </p>
            <p
              className={cn(
                'text-sm font-semibold',
                isWin && 'text-emerald-400',
                isLoss && 'text-red-400',
              )}
            >
              {currentLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Max Win Streak</p>
            <p className="text-lg font-semibold text-emerald-400">
              {streak.maxConsecutiveWin}x
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Max Loss Streak</p>
            <p className="text-lg font-semibold text-red-400">
              {streak.maxConsecutiveLoss}x
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
