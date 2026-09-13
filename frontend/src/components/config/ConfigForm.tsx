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
import { formatPercent } from '@/lib/format'
import { useConfig, useUpdateConfig } from '@/hooks/useJournal'
import { configFormSchema, type ConfigFormValues } from '@/schemas/config.schema'

export function ConfigForm() {
  const configQuery = useConfig()
  const updateConfig = useUpdateConfig()
  const config = configQuery.data

  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [tagError, setTagError] = useState('')
  const [saved, setSaved] = useState(false)

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      accountBalance: 0,
      riskPercent: 1,
      targetWinRate: 50,
      setupTags: [],
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = form

  useEffect(() => {
    if (!config) return
    reset({
      accountBalance: config.accountBalance,
      riskPercent: config.riskPercent,
      targetWinRate: config.targetWinRate,
      setupTags: config.setupTags,
    })
    setTags(config.setupTags)
  }, [config, reset])

  const accountBalance = watch('accountBalance')
  const riskPercent = watch('riskPercent')
  const riskAmount =
    Number.isFinite(accountBalance) && Number.isFinite(riskPercent)
      ? (accountBalance * riskPercent) / 100
      : 0

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
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="accountBalance">Account Balance (USDT)</Label>
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
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="riskPercent">Risk per Trade (%)</Label>
            <Input
              id="riskPercent"
              type="number"
              step="any"
              {...register('riskPercent', { valueAsNumber: true })}
            />
            {errors.riskPercent ? (
              <p className="text-xs text-red-400">
                {errors.riskPercent.message}
              </p>
            ) : null}
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
          <p className="text-sm text-muted-foreground sm:col-span-3">
            Risiko per trade saat ini:{' '}
            <span className="font-semibold text-foreground">
              {new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 2,
              }).format(riskAmount)}{' '}
              USDT
            </span>{' '}
            · Target WR {formatPercent(config.targetWinRate)}
          </p>
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
