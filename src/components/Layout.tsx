import { ClipboardList, History, House, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: House },
  { to: '/plan', label: 'Plan', icon: ClipboardList },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col pt-[env(safe-area-inset-top)]">
      <main className="flex-1 px-4 pt-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground',
                    isActive && 'text-foreground',
                  )
                }
              >
                <Icon className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
