import { Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { formatClock } from '@/lib/time'
import { cn } from '@/lib/utils'

export interface RestState {
  until: number // epoch ms
  total: number // seconds, for the progress bar
  label: string
}

// Countdown bar shown above the tab bar between sets. Based on a timestamp,
// so it stays correct if the phone locks or the app reloads.
export function RestTimer({
  rest,
  onAdjust,
  onDone,
}: {
  rest: RestState
  onAdjust: (seconds: number) => void
  onDone: () => void
}) {
  const now = useNow(250)
  const left = (rest.until - now) / 1000
  const over = left <= 0

  return (
    <div
      role="timer"
      aria-live="polite"
      className={cn(
        'fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur',
        over && 'border-primary',
      )}
    >
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${Math.min(100, Math.max(0, (1 - left / rest.total) * 100))}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <Timer className="size-5 text-muted-foreground" />
        <div className="flex-1">
          <div className={cn('text-2xl font-semibold tabular-nums', over && 'text-primary')}>
            {over ? 'Go' : formatClock(left)}
          </div>
          <div className="text-xs text-muted-foreground">{over ? `Rest over · ${rest.label}` : `Rest · ${rest.label}`}</div>
        </div>
        {!over && (
          <>
            <Button variant="outline" size="sm" onClick={() => onAdjust(-15)}>−15s</Button>
            <Button variant="outline" size="sm" onClick={() => onAdjust(30)}>+30s</Button>
          </>
        )}
        <Button size="sm" onClick={onDone}>{over ? 'Close' : 'Skip'}</Button>
      </div>
    </div>
  )
}
