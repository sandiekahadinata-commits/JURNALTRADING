import type { JournalConfig, Trade } from '@/types/journal.types'

export interface ApiErrorShape {
  code: string
  message: string
}

export interface BootstrapResult {
  trades: Trade[]
  config: JournalConfig
}

export interface RecalcResult {
  trades: number
  months: number
}

export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorShape }

export interface PingResult {
  app: string
  time: string
  timezone: string
  configured: boolean
}

export interface ClearAllResult {
  deleted: number
}

export interface SeedDemoResult {
  inserted: number
}
