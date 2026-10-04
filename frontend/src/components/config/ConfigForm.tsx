import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'

import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DEFAULT_INITIAL_BALANCE } from '@/lib/constants'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAccountRisk, useConfig, useUpdateConfig } from '@/hooks/useJournal'
import { configFormSchema, type ConfigFormValues } from '@/schemas/config.schema'

export function ConfigForm() {
  const configQuery = useConfig()
  const updateConfig = useUpdateConfig()
  const config = configQuery.data
  const accountRisk = useAccountRisk()

  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [tagError, setTagError] = useState('')
  const [saved, setSaved] = useState(false)

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      accountBalance: DEFAULT_INITIAL_BALANCE,
      targetWinRate: 50,
      setupTags: [],
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form

  useEffect(() => {
    if (!config) return
    reset({
      accountBalance: config.accountBalance,
      targetWinRate: config.targetWinRate,
      setupTags: config.setupTags,
    })
    setTags(config.setupTags)
  }, [config, reset])

  function addTag() {
    const value = newTag.trim()
    if (!value) return
    if (tags.includes(value)) {
      setTagError('Setup tag sudah ada.')
      return
    }
    setTags([...tags, value])
    setNewTag('')
    setTagError('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  const submit = handleSubmit(async (values) => {
    if (tags.length === 0) {
      setTagError('Minimal 1 setup tag.')
      return
    }
    try {
      await updateConfig.mutateAsync({ ...values, setupTags: tags })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch {
      /* error tampil via updateConfig.error */
    }
  })

  if (configQuery.isLoading) {
    return <LoadingState variant="form" />
  }

  if (configQuery.isError || !config) {
    return <ErrorState error={configQuery.error} onRetry={() => void configQuery.refetch()} />
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Pengaturan Akun</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="accountBalance">Modal Awal (USDT)</Label>
            <Input
              id="accountBalance"
              type="number"
              step="any"
              {...register('accountBalance', { valueAsNumber: true })}
            />
            {errors.accountBalance ? (
              <p className="text-xs text-red-400">
                {errors.accountBalance.message}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Saldo saat ini dihitung otomatis: modal awal + akumulasi P&L.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="targetWinRate">Target Win Rate (%)</Label>
            <Input
              id="targetWinRate"
              type="number"
              step="any"
              {...register('targetWinRate', { valueAsNumber: true })}
            />
            {errors.targetWinRate ? (
              <p className="text-xs text-red-400">
                {errors.targetWinRate.message}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Strategi Risiko</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(accountRisk.currentBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total P&L</p>
              <p
                className={cn(
                  'text-lg font-semibold tabular-nums',
                  accountRisk.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400',
                )}
              >
                {formatCurrency(accountRisk.totalPnl, { signed: true })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk per Trade</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatPercent(accountRisk.riskPercent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nilai Risiko</p>
              <p className="text-lg font-semibold tabular-nums">
                {formatCurrency(accountRisk.riskAmount)}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Fase aktif:{' '}
            <span className="font-medium text-foreground">
              {accountRisk.tier.phase}
            </span>
            {accountRisk.nextTier ? (
              <>
                {' '}
                · Turun ke {formatPercent(accountRisk.nextTier.percent)} saat
                saldo mencapai{' '}
                {formatCurrency(accountRisk.nextTier.minBalance)}
              </>
            ) : (
              ' · Risiko sudah di floor minimum'
            )}
          </p>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Saldo (USDT)</TableHead>
                  <TableHead className="text-right">Risk %</TableHead>
                  <TableHead>Fase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountRisk.tiers.map((tier, index) => {
                  const next = accountRisk.tiers[index + 1]
                  const isActive = tier === accountRisk.tier
                  return (
                    <TableRow
                      key={tier.minBalance}
                      className={cn(isActive && 'bg-primary/10')}
                    >
                      <TableCell className="tabular-nums">
                        {formatCurrency(tier.minBalance)}
                        {next ? ` – ${formatCurrency(next.minBalance)}` : '+'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium tabular-nums',
                          isActive && 'text-primary',
                        )}
                      >
                        {formatPercent(tier.percent)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tier.phase}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Setup Tag Kustom</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada setup tag.
              </p>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground transition-colors hover:text-red-400"
                    aria-label={`Hapus ${tag}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Tambah setup baru..."
              value={newTag}
              onChange={(event) => {
                setNewTag(event.target.value)
                setTagError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addTag()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>
          {tagError ? (
            <p className="text-xs text-red-400">{tagError}</p>
          ) : null}
        </CardContent>
      </Card>

      {updateConfig.isError ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          Gagal menyimpan konfigurasi: {updateConfig.error?.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateConfig.isPending}>
          {updateConfig.isPending ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </Button>
        {saved ? (
          <span className="text-sm text-emerald-400">
            Konfigurasi tersimpan.
          </span>
        ) : null}
      </div>
    </form>
  )
}
