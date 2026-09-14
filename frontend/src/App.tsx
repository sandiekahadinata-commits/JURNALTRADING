import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { LoadingState } from '@/components/common/LoadingState'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { prefetchJournal } from '@/hooks/useJournal'
import { sessionQueryKey, useSession } from '@/hooks/useAuth'

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const TradeLogPage = lazy(() =>
  import('@/pages/TradeLogPage').then((m) => ({ default: m.TradeLogPage })),
)
const MonthlyPage = lazy(() =>
  import('@/pages/MonthlyPage').then((m) => ({ default: m.MonthlyPage })),
)
const ConfigPage = lazy(() =>
  import('@/pages/ConfigPage').then((m) => ({ default: m.ConfigPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

function AuthenticatedApp() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trades" element={<TradeLogPage />} />
          <Route path="/monthly" element={<MonthlyPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

function AuthGate() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useSession()

  useEffect(() => {
    function handleUnauthorized() {
      queryClient.setQueryData(sessionQueryKey, { authenticated: false })
    }
    window.addEventListener('journal:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('journal:unauthorized', handleUnauthorized)
    }
  }, [queryClient])

  useEffect(() => {
    if (data?.authenticated) {
      void prefetchJournal(queryClient)
    }
  }, [data?.authenticated, queryClient])

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingState />
      </div>
    )
  }
  if (!data?.authenticated) return <LoginPage />

  return <AuthenticatedApp />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  )
}
