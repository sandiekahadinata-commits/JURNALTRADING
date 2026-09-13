import { apiGet, apiPost } from '@/services/api'
import type { TradeInput } from '@/lib/trade-utils'
import type { JournalConfig, Trade } from '@/types/journal.types'
import type { ClearAllResult, PingResult, SeedDemoResult } from '@/types/api.types'

export interface TradeFilters {
  month?: string
  symbol?: string
  result?: string
  search?: string
}

export const journalService = {
  ping: () => apiGet<PingResult>('ping'),

  listTrades: (filters?: TradeFilters) =>
    apiGet<Trade[]>('listTrades', filters as Record<string, string> | undefined),

  getConfig: () => apiGet<JournalConfig>('getConfig'),

  createTrade: (input: TradeInput) => apiPost<Trade>('createTrade', input),

  updateTrade: (id: string, input: TradeInput) =>
    apiPost<Trade>('updateTrade', { id, input }),

  deleteTrade: (id: string) => apiPost<{ deleted: string }>('deleteTrade', { id }),

  updateConfig: (patch: Partial<JournalConfig>) =>
    apiPost<JournalConfig>('updateConfig', patch),

  seedDemo: () => apiPost<SeedDemoResult>('seedDemo'),

  clearAll: () => apiPost<ClearAllResult>('clearAll'),
}
