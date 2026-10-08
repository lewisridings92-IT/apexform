import { useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

// Shown instead of a blank or developer error page if a screen crashes.
// Data is in the local database, so reloading never loses saved sets.
export function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : String(error)

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        Your saved workouts are safe. Reloading usually fixes this.
      </p>
      <Button size="lg" onClick={() => window.location.reload()}>
        Reload
      </Button>
      <Button variant="ghost" onClick={() => window.location.assign(window.location.pathname)}>
        Go to Home
      </Button>
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">{message}</pre>
    </div>
  )
}
