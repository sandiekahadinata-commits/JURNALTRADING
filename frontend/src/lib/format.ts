import { MONTH_LABELS_ID } from '@/lib/constants'
import { dayOfWeekIndex } from '@/lib/date'

const DAY_LABELS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

/** Format tanggal ISO (YYYY-MM-DD) menjadi DD/MM/YYYY. */
export function formatDateID(iso: string): string {
  if (!iso) return '-'
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}

/** Format tanggal ISO menjadi label hari singkat, mis. "Sen 08/09". */
export function formatDayShortID(iso: string): string {
  if (!iso) return '-'
  const [, month, day] = iso.split('-')
  if (!month || !day) return iso
  const label = DAY_LABELS_ID[dayOfWeekIndex(iso)] ?? ''
  return `${label} ${day}/${month}`
}

/** Rentang tanggal, mis. "08/09/2026 – 14/09/2026". */
export function formatDateRangeID(start: string, end: string): string {
  return `${formatDateID(start)} – ${formatDateID(end)}`
}

/** Ambil key bulan (YYYY-MM) dari tanggal ISO (YYYY-MM-DD). */
export function toMonthKey(iso: string): string {
  if (!iso) return ''
  return iso.slice(0, 7)
}

/** Label bulan singkat dalam Bahasa Indonesia, mis. "Jul 2026". */
export function formatMonthLabel(monthKey: string, withYear = true): string {
  if (!monthKey) return '-'
  const [year, month] = monthKey.split('-')
  const label = MONTH_LABELS_ID[Number(month) - 1] ?? month
  return withYear ? `${label} ${year}` : label
}

/** Label bulan panjang Bahasa Indonesia. */
export function formatMonthLongID(monthKey: string): string {
  const NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  if (!monthKey) return '-'
  const [year, month] = monthKey.split('-')
  return `${NAMES[Number(month) - 1] ?? month} ${year}`
}

/** Format mata uang USDT, mis. +$1,250 / -$320. */
export function formatCurrency(value: number, options?: { signed?: boolean }): string {
  const signed = options?.signed ?? false
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(abs)
  const sign = value < 0 ? '-' : signed ? '+' : ''
  return `${sign}$${formatted}`
}

/** Format nilai R, mis. +3.0R / -1.0R. */
export function formatR(value: number, options?: { signed?: boolean }): string {
  const signed = options?.signed ?? false
  const sign = value < 0 ? '-' : signed ? '+' : ''
  return `${sign}${Math.abs(value).toFixed(1)}R`
}

/** Format persentase, mis. 42.9%. */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** Format angka umum dengan pemisah ribuan. */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Format nilai bertanda untuk Profit Factor, mis. 1.85x. */
export function formatProfitFactor(value: number): string {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '0.00x'
  return `${value.toFixed(2)}x`
}
