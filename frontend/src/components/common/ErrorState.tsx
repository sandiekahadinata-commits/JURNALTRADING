import { AlertTriangle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function messageFrom(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Terjadi kesalahan yang tidak diketahui.'
}

interface ErrorStateProps {
  error?: unknown
  title?: string
  onRetry?: () => void
}

export function ErrorState({ error, title = 'Gagal memuat data', onRetry }: ErrorStateProps) {
  return (
    <Card className="border-red-500/30">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="max-w-md text-sm text-muted-foreground">{messageFrom(error)}</p>
        </div>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
