import { ClipboardList, History, House, Settings } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, NavLink, Outlet, useMatch } from 'react-router'
import { getProfile } from '@/db/profile'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: House },
  { to: '/plan', label: 'Plan', icon: ClipboardList },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Layout() {
  const profile = useLiveQuery(getProfile, [])
  // The workout logger is full screen with its own sticky header.
  const inWorkout = useMatch('/workout/:dayIndex?') !== null

  if (profile === undefined) return null // still loading
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />

  return (
    <div className={cn('mx-auto flex min-h-dvh max-w-lg flex-col', !inWorkout && 'pt-[env(safe-area-inset-top)]')}>
      <main className={cn('flex-1 px-4 pb-24', !inWorkout && 'pt-4')}>
        <Outlet />
      </main>

      {!inWorkout && (
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
      )}
    </div>
  )
}
