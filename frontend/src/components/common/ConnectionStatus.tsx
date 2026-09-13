import { RefreshCw } from 'lucide-react'

import { usePing } from '@/hooks/useJournal'
import { cn } from '@/lib/utils'

export function ConnectionStatus({ compact = false }: { compact?: boolean }) {
  const { status, refetch, isFetching } = usePing()

  const isConnected = status === 'success'
  const isOffline = status === 'error'

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          isConnected && 'bg-emerald-400',
          isOffline && 'bg-red-400',
          !isConnected && !isOffline && 'bg-amber-400 animate-pulse',
        )}
      />
      {!compact ? (
        <span className="truncate">
          {isConnected
            ? 'Google Sheets tersambung'
            : isOffline
              ? 'Backend offline'
              : 'Menghubungkan...'}
        </span>
      ) : null}
      {isOffline ? (
        <button
          type="button"
          onClick={() => void refetch()}
          className="ml-auto flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
          disabled={isFetching}
        >
          <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
          Retry
        </button>
      ) : null}
    </div>
  )
}
