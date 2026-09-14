import { apiGet, apiPost, ApiError } from '@/services/api'
import type { TradeInput } from '@/lib/trade-utils'
import type { JournalConfig, Trade } from '@/types/journal.types'
import type {
  BootstrapResult,
  ClearAllResult,
  PingResult,
  RecalcResult,
  SeedDemoResult,
} from '@/types/api.types'

export interface TradeFilters {
  month?: string
  symbol?: string
  result?: string
  search?: string
}

/**
 * Satu panggilan untuk trades + config. Jika backend belum di-deploy ulang
 * (action `bootstrap` belum ada), fallback ke dua endpoint lama agar aplikasi
 * tetap berjalan.
 */
async function fetchBootstrap(): Promise<BootstrapResult> {
  try {
    return await apiGet<BootstrapResult>('bootstrap')
  } catch (err) {
    if (err instanceof ApiError && err.code === 'UNKNOWN_ACTION') {
      const [trades, config] = await Promise.all([
        apiGet<Trade[]>('listTrades'),
        apiGet<JournalConfig>('getConfig'),
      ])
      return { trades, config }
    }
    throw err
  }
}

export const journalService = {
  ping: () => apiGet<PingResult>('ping'),

  bootstrap: fetchBootstrap,

  listTrades: (filters?: TradeFilters) =>
    apiGet<Trade[]>('listTrades', filters as Record<string, string> | undefined),

  getConfig: () => apiGet<JournalConfig>('getConfig'),

  recalcSheets: () => apiPost<RecalcResult>('recalcAll'),

  createTrade: (input: TradeInput) => apiPost<Trade>('createTrade', input),

  updateTrade: (id: string, input: TradeInput) =>
    apiPost<Trade>('updateTrade', { id, input }),

  deleteTrade: (id: string) => apiPost<{ deleted: string }>('deleteTrade', { id }),

  updateConfig: (patch: Partial<JournalConfig>) =>
    apiPost<JournalConfig>('updateConfig', patch),

  seedDemo: () => apiPost<SeedDemoResult>('seedDemo'),

  clearAll: () => apiPost<ClearAllResult>('clearAll'),
}
