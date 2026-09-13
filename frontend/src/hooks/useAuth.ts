import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchSession, login, logout } from '@/services/auth'

export const sessionQueryKey = ['session'] as const

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: fetchSession,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    },
  })
}
