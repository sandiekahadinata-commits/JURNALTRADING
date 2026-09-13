import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  DIRECTIONS,
  MARKET_SESSIONS,
  TIMEFRAMES,
  TRADE_RESULTS,
} from '@/lib/constants'
import { formatCurrency, formatR } from '@/lib/format'
import {
  computeRiskPerTrade,
  computeRMultiple,
  type TradeInput,
  validateRR,
} from '@/lib/trade-utils'
import { cn } from '@/lib/utils'
import {
  tradeFormSchema,
  type TradeFormValues,
} from '@/schemas/trade.schema'
import type { Trade } from '@/types/journal.types'

const NONE = '__none__'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyValues(): TradeFormValues {
  return {
    entryDate: todayISO(),
    exitDate: todayISO(),
    symbol: '',
    direction: 'Long',
    timeframe: '1H',
    entryPrice: undefined as unknown as number,
    stopLoss: undefined as unknown as number,
    takeProfit: undefined as unknown as number,
    positionSize: undefined as unknown as number,
    result: 'Win',
    exitPrice: undefined as unknown as number,
    pnl: undefined as unknown as number,
    setupTag: '',
    session: undefined,
    notes: '',
    screenshotUrl: '',
  }
}

function toFormValues(trade: Trade): TradeFormValues {
  return {
    entryDate: trade.entryDate,
    exitDate: trade.exitDate,
    symbol: trade.symbol,
    direction: trade.direction,
    timeframe: trade.timeframe,
    entryPrice: trade.entryPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    positionSize: trade.positionSize,
    result: trade.result,
    exitPrice: trade.exitPrice,
    pnl: trade.pnl,
    setupTag: trade.setupTag ?? '',
    session: trade.session,
    notes: trade.notes ?? '',
    screenshotUrl: trade.screenshotUrl ?? '',
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-400">{message}</p>
}

interface TradeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade?: Trade | null
  setupTags: string[]
  onSubmit: (input: TradeInput) => Promise<unknown>
}

export function TradeFormDialog({
  open,
  onOpenChange,
  trade,
  setupTags,
  onSubmit,
}: TradeFormDialogProps) {
  const isEdit = Boolean(trade)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: emptyValues(),
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form

  useEffect(() => {
    if (open) {
      reset(trade ? toFormValues(trade) : emptyValues())
      setSubmitError(null)
    }
  }, [open, trade, reset])

  const watched = watch()

  const preview = useMemo(() => {
    const { entryPrice, stopLoss, takeProfit, positionSize, pnl, direction } =
      watched
    const hasNumbers =
      Number.isFinite(entryPrice) &&
      Number.isFinite(stopLoss) &&
      Number.isFinite(positionSize)
    const riskPerTrade = hasNumbers
      ? computeRiskPerTrade({ entryPrice, stopLoss, positionSize })
      : 0
    const rMultiple = Number.isFinite(pnl)
      ? computeRMultiple(pnl, riskPerTrade)
      : 0
    const rr =
      Number.isFinite(entryPrice) &&
      Number.isFinite(stopLoss) &&
      Number.isFinite(takeProfit)
        ? validateRR({ entryPrice, stopLoss, takeProfit, direction })
        : null
    return { riskPerTrade, rMultiple, rr, hasNumbers }
  }, [watched])

  const submit = handleSubmit(async (values) => {
    const input: TradeInput = {
      entryDate: values.entryDate,
      exitDate: values.exitDate,
      symbol: values.symbol,
      direction: values.direction,
      timeframe: values.timeframe,
      entryPrice: values.entryPrice,
      stopLoss: values.stopLoss,
      takeProfit: values.takeProfit,
      positionSize: values.positionSize,
      result: values.result,
      exitPrice: values.exitPrice,
      pnl: values.pnl,
      setupTag: values.setupTag || undefined,
      session: values.session,
      notes: values.notes || undefined,
      screenshotUrl: values.screenshotUrl || undefined,
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(input)
      onOpenChange(false)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Gagal menyimpan trade. Coba lagi.',
      )
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Trade' : 'Tambah Trade'}</DialogTitle>
          <DialogDescription>
            Field R-Multiple, Risk per Trade, dan Bulan dihitung otomatis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="entryDate">Tanggal Entry</Label>
              <Input id="entryDate" type="date" {...register('entryDate')} />
              <FieldError message={errors.entryDate?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exitDate">Tanggal Exit</Label>
              <Input id="exitDate" type="date" {...register('exitDate')} />
              <FieldError message={errors.exitDate?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="symbol">Symbol / Pair</Label>
              <Input
                id="symbol"
                placeholder="BTC/USDT"
                {...register('symbol')}
              />
              <FieldError message={errors.symbol?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Arah</Label>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTIONS.map((direction) => (
                        <SelectItem key={direction} value={direction}>
                          {direction}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Timeframe</Label>
              <Controller
                control={control}
                name="timeframe"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map((timeframe) => (
                        <SelectItem key={timeframe} value={timeframe}>
                          {timeframe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Setup Tag</Label>
              <Controller
                control={control}
                name="setupTag"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value : NONE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih setup" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Tidak ada</SelectItem>
                      {setupTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Sesi Pasar</Label>
              <Controller
                control={control}
                name="session"
                render={({ field }) => (
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sesi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Tidak ada</SelectItem>
                      {MARKET_SESSIONS.map((session) => (
                        <SelectItem key={session} value={session}>
                          {session}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hasil</Label>
              <Controller
                control={control}
                name="result"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADE_RESULTS.map((result) => (
                        <SelectItem key={result} value={result}>
                          {result}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                type="number"
                step="any"
                {...register('entryPrice', { valueAsNumber: true })}
              />
              <FieldError message={errors.entryPrice?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stopLoss">Stop Loss</Label>
              <Input
                id="stopLoss"
                type="number"
                step="any"
                {...register('stopLoss', { valueAsNumber: true })}
              />
              <FieldError message={errors.stopLoss?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="takeProfit">Take Profit</Label>
              <Input
                id="takeProfit"
                type="number"
                step="any"
                {...register('takeProfit', { valueAsNumber: true })}
              />
              <FieldError message={errors.takeProfit?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="positionSize">Ukuran Posisi (USDT)</Label>
              <Input
                id="positionSize"
                type="number"
                step="any"
                {...register('positionSize', { valueAsNumber: true })}
              />
              <FieldError message={errors.positionSize?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exitPrice">Harga Exit Aktual</Label>
              <Input
                id="exitPrice"
                type="number"
                step="any"
                {...register('exitPrice', { valueAsNumber: true })}
              />
              <FieldError message={errors.exitPrice?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pnl">P&L Aktual (USDT)</Label>
              <Input
                id="pnl"
                type="number"
                step="any"
                {...register('pnl', { valueAsNumber: true })}
              />
              <FieldError message={errors.pnl?.message} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Perhitungan Otomatis
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Risk per Trade</p>
                <p className="font-semibold">
                  {preview.hasNumbers
                    ? formatCurrency(preview.riskPerTrade)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">R-Multiple</p>
                <p
                  className={cn(
                    'font-semibold',
                    preview.rMultiple >= 0
                      ? 'text-emerald-400'
                      : 'text-red-400',
                  )}
                >
                  {formatR(preview.rMultiple, { signed: true })}
                </p>
              </div>
            </div>
            {preview.rr ? (
              <div
                className={cn(
                  'mt-3 flex items-start gap-2 rounded-md border p-2 text-xs',
                  preview.rr.valid
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                )}
              >
                {preview.rr.valid ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                )}
                <span>{preview.rr.message}</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="screenshotUrl">Screenshot URL</Label>
            <Input
              id="screenshotUrl"
              placeholder="https://..."
              {...register('screenshotUrl')}
            />
            <FieldError message={errors.screenshotUrl?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              placeholder="Reasoning masuk, kondisi market, pelajaran..."
              {...register('notes')}
            />
          </div>

          {submitError ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {submitError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Menyimpan...'
                : isEdit
                  ? 'Simpan Perubahan'
                  : 'Tambah Trade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
