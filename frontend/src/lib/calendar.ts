import { addDays, dayOfWeekIndex, toDateKey, todayKey } from '@/lib/date'
import type { DailyMetrics } from '@/types/journal.types'

export interface CalendarCell {
  /** Key `YYYY-MM-DD` untuk sel ini. */
  dateKey: string
  /** Nomor hari dalam bulan (1-31). */
  dayNumber: number
  /** Apakah sel termasuk bulan yang sedang ditampilkan. */
  inMonth: boolean
  /** Apakah sel adalah hari ini (waktu lokal device). */
  isToday: boolean
  /** Metrik harian, null jika tidak ada trade pada tanggal tersebut. */
  metrics: DailyMetrics | null
}

/** Ambil key bulan (YYYY-MM) dari date key (YYYY-MM-DD). */
export function monthKeyFromDateKey(dateKey: string): string {
  return dateKey.slice(0, 7)
}

/** Geser bulan sebanyak `delta` (boleh negatif). */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  const date = new Date(year, month - 1 + delta, 1)
  return toDateKey(date).slice(0, 7)
}

/**
 * Bangun grid kalender untuk satu bulan.
 * Jumlah baris menyesuaikan (4-6 baris x 7 kolom).
 * `weekStartsOn`: 0 = Minggu, 1 = Senin.
 */
export function buildMonthGrid(
  monthKey: string,
  metricsByDate: Map<string, DailyMetrics>,
  today: string = todayKey(),
  weekStartsOn = 1,
): CalendarCell[] {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return []

  const firstKey = toDateKey(new Date(year, month - 1, 1))
  const leading = (dayOfWeekIndex(firstKey) - weekStartsOn + 7) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7
  const startKey = addDays(firstKey, -leading)

  const cells: CalendarCell[] = []
  for (let i = 0; i < totalCells; i += 1) {
    const dateKey = addDays(startKey, i)
    cells.push({
      dateKey,
      dayNumber: Number(dateKey.slice(8, 10)),
      inMonth: dateKey.slice(0, 7) === monthKey,
      isToday: dateKey === today,
      metrics: metricsByDate.get(dateKey) ?? null,
    })
  }
  return cells
}
