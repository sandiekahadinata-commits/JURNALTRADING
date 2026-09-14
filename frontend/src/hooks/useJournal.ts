import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import type { TradeInput } from '@/lib/trade-utils'
import { journalService } from '@/services/journal.service'
import type { BootstrapResult } from '@/types/api.types'
import type { JournalConfig, Trade } from '@/types/journal.types'

export const queryKeys = {
  journal: ['journal'] as const,
  ping: ['ping'] as const,
}

function sortByExitDesc(trades: Trade[]): Trade[] {
  return [...trades].sort((a, b) => b.exitDate.localeCompare(a.exitDate))
}

function updateJournalCache(
  queryClient: QueryClient,
  updater: (current: BootstrapResult) => BootstrapResult,
): void {
  queryClient.setQueryData<BootstrapResult>(queryKeys.journal, (current) =>
    current ? updater(current) : current,
  )
}

export function prefetchJournal(queryClient: QueryClient): Promise<void> {
  return queryClient.prefetchQuery({
    queryKey: queryKeys.journal,
    queryFn: () => journalService.bootstrap(),
  })
}

export function useTrades() {
  return useQuery({
    queryKey: queryKeys.journal,
    queryFn: () => journalService.bootstrap(),
    select: (data: BootstrapResult) => data.trades,
  })
}

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.journal,
    queryFn: () => journalService.bootstrap(),
    select: (data: BootstrapResult) => data.config,
  })
}

export function usePing() {
  return useQuery({
    queryKey: queryKeys.ping,
    queryFn: () => journalService.ping(),
    retry: false,
    staleTime: 60_000,
  })
}

export function useCreateTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TradeInput) => journalService.createTrade(input),
    onSuccess: (created) => {
      updateJournalCache(queryClient, (current) => ({
        ...current,
        trades: sortByExitDesc([created, ...current.trades]),
      }))
    },
  })
}

export function useUpdateTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TradeInput }) =>
      journalService.updateTrade(id, input),
    onSuccess: (updated) => {
      updateJournalCache(queryClient, (current) => ({
        ...current,
        trades: sortByExitDesc(
          current.trades.map((trade) => (trade.id === updated.id ? updated : trade)),
        ),
      }))
    },
  })
}

export function useDeleteTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => journalService.deleteTrade(id),
    onSuccess: (_result, id) => {
      updateJournalCache(queryClient, (current) => ({
        ...current,
        trades: current.trades.filter((trade) => trade.id !== id),
      }))
    },
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<JournalConfig>) => journalService.updateConfig(patch),
    onSuccess: (config) => {
      updateJournalCache(queryClient, (current) => ({ ...current, config }))
    },
  })
}

export function useSeedDemo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => journalService.seedDemo(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.journal })
    },
  })
}

export function useClearAll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => journalService.clearAll(),
    onSuccess: () => {
      updateJournalCache(queryClient, (current) => ({ ...current, trades: [] }))
    },
  })
}

export function useRecalcSheets() {
  return useMutation({
    mutationFn: () => journalService.recalcSheets(),
  })
}
