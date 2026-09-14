/** Utilitas tanggal berbasis key `YYYY-MM-DD` tanpa dependency tambahan. */

/** Parse `YYYY-MM-DD` menjadi Date lokal (jam 00:00). */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return new Date(Number.NaN)
  return new Date(year, month - 1, day)
}

/** Format Date lokal menjadi key `YYYY-MM-DD`. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Key `YYYY-MM-DD` untuk tanggal hari ini (waktu lokal device). */
export function todayKey(): string {
  return toDateKey(new Date())
}

/** Tambah/kurangi hari dari sebuah date key. */
export function addDays(dateKey: string, amount: number): string {
  const date = parseDateKey(dateKey)
  if (Number.isNaN(date.getTime())) return dateKey
  date.setDate(date.getDate() + amount)
  return toDateKey(date)
}

/** Index hari dalam seminggu (0 = Minggu). */
export function dayOfWeekIndex(dateKey: string): number {
  const date = parseDateKey(dateKey)
  return Number.isNaN(date.getTime()) ? 0 : date.getDay()
}
