import { DatabaseZap, RotateCcw, Trash2 } from 'lucide-react'

import { ConfigForm } from '@/components/config/ConfigForm'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import { useClearAll, useSeedDemo, useTrades } from '@/hooks/useJournal'

export function ConfigPage() {
  const tradesQuery = useTrades()
  const seedDemo = useSeedDemo()
  const clearAll = useClearAll()

  const trades = tradesQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Config"
        description="Pengaturan akun, target, dan daftar setup."
      />

      <ConfigForm />

      <Card className="border-red-500/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-red-400">Zona Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4" />
              Total trade tersimpan:{' '}
              <span className="font-medium text-foreground">
                {tradesQuery.isLoading ? '...' : trades.length}
              </span>
            </span>
            <span className="flex items-center gap-2">
              Total P&L:{' '}
              <span className="font-medium text-foreground">
                {formatCurrency(
                  trades.reduce((sum, t) => sum + t.pnl, 0),
                  { signed: true },
                )}
              </span>
            </span>
          </div>

          {seedDemo.isError ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              Gagal mengisi data dummy: {seedDemo.error?.message}
            </p>
          ) : null}
          {clearAll.isError ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              Gagal menghapus data: {clearAll.error?.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={seedDemo.isPending}>
                  <RotateCcw className="h-4 w-4" />
                  {seedDemo.isPending ? 'Mengisi...' : 'Reset ke Data Dummy'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset ke data dummy?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua trade saat ini akan diganti dengan data contoh 6 bulan
                    dan konfigurasi kembali ke default.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => seedDemo.mutate()}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={clearAll.isPending}>
                  <Trash2 className="h-4 w-4" />
                  {clearAll.isPending ? 'Menghapus...' : 'Hapus Semua Trade'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus semua trade?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak bisa dibatalkan. Semua trade akan dihapus
                    permanen, konfigurasi tetap dipertahankan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => clearAll.mutate()}
                  >
                    Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
