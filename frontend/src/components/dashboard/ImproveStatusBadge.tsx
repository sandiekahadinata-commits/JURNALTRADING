import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ImproveVerdict } from '@/types/journal.types'

const VERDICT_STYLES: Record<
  ImproveVerdict,
  { className: string; icon: typeof TrendingUp; label: string }
> = {
  IMPROVING: {
    className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
    icon: TrendingUp,
    label: 'IMPROVING',
  },
  'NEEDS ATTENTION': {
    className: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
    icon: Minus,
    label: 'NEEDS ATTENTION',
  },
  DECLINING: {
    className: 'border-red-500/30 bg-red-500/15 text-red-400',
    icon: TrendingDown,
    label: 'DECLINING',
  },
}

export function ImproveStatusBadge({
  verdict,
  className,
}: {
  verdict: ImproveVerdict
  className?: string
}) {
  const config = VERDICT_STYLES[verdict]
  const Icon = config.icon
  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 border px-3 py-1', config.className, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}
