import { NavLink } from 'react-router-dom'
import {
  CandlestickChart,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Settings,
  Table2,
} from 'lucide-react'

import { ConnectionStatus } from '@/components/common/ConnectionStatus'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/trades', label: 'Trade Log', icon: NotebookPen, end: false },
  { to: '/monthly', label: 'Monthly', icon: Table2, end: false },
  { to: '/config', label: 'Config', icon: Settings, end: false },
]

function NavItems({ orientation }: { orientation: 'vertical' | 'horizontal' }) {
  return (
    <nav
      className={cn(
        'flex gap-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row overflow-x-auto',
      )}
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              orientation === 'horizontal' && 'whitespace-nowrap',
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const logout = useLogout()

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/40 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-border/60 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <CandlestickChart className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Crypto Journal</p>
              <p className="text-xs text-muted-foreground">RR 1:3 Tracker</p>
            </div>
          </div>
          <div className="flex-1 p-4">
            <NavItems orientation="vertical" />
          </div>
          <div className="border-t border-border/60 p-4">
            <ConnectionStatus />
            <p className="mt-2 text-xs text-muted-foreground">
              Data tersimpan di Google Sheets.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start text-muted-foreground"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <CandlestickChart className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">Crypto Journal</span>
              <span className="ml-auto">
                <ConnectionStatus compact />
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <NavItems orientation="horizontal" />
          </header>

          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
