import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { TradeInput } from '@/lib/trade-utils'
import { journalService } from '@/services/journal.service'
import type { JournalConfig } from '@/types/journal.types'

export const queryKeys = {
  trades: ['trades'] as const,
  config: ['config'] as const,
  ping: ['ping'] as const,
}

export function useTrades() {
  return useQuery({
    queryKey: queryKeys.trades,
    queryFn: () => journalService.listTrades(),
  })
}

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: () => journalService.getConfig(),
  })
}

export function usePing() {
  return useQuery({
    queryKey: queryKeys.ping,
    queryFn: () => journalService.ping(),
    retry: false,
    refetchInterval: 60_000,
  })
}

function useInvalidateJournal() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.trades })
    void queryClient.invalidateQueries({ queryKey: queryKeys.config })
  }
}

export function useCreateTrade() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: (input: TradeInput) => journalService.createTrade(input),
    onSuccess: invalidate,
  })
}

export function useUpdateTrade() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TradeInput }) =>
      journalService.updateTrade(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteTrade() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: (id: string) => journalService.deleteTrade(id),
    onSuccess: invalidate,
  })
}

export function useUpdateConfig() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: (patch: Partial<JournalConfig>) => journalService.updateConfig(patch),
    onSuccess: invalidate,
  })
}

export function useSeedDemo() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: () => journalService.seedDemo(),
    onSuccess: invalidate,
  })
}

export function useClearAll() {
  const invalidate = useInvalidateJournal()
  return useMutation({
    mutationFn: () => journalService.clearAll(),
    onSuccess: invalidate,
  })
}
