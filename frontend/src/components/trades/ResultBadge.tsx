import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TradeResult } from '@/types/journal.types'

const RESULT_STYLES: Record<TradeResult, string> = {
  Win: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  Loss: 'border-red-500/30 bg-red-500/15 text-red-400',
  'Break Even': 'border-amber-500/30 bg-amber-500/15 text-amber-400',
}

export function ResultBadge({ result }: { result: TradeResult }) {
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap', RESULT_STYLES[result])}
    >
      {result}
    </Badge>
  )
}
