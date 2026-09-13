import { Check, X } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ImproveStatus } from '@/types/journal.types'

export function ImproveBreakdown({ status }: { status: ImproveStatus }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Dimensi Improve</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status.dimensions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada bulan pembanding untuk menghitung tren.
          </p>
        ) : (
          <>
            {status.dimensions.map((dimension) => (
              <div
                key={dimension.label}
                className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    dimension.improved
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400',
                  )}
                >
                  {dimension.improved ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{dimension.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {dimension.detail}
                  </p>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {status.improvedCount} dari 3 dimensi membaik (butuh ≥2 untuk
              status IMPROVING).
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
