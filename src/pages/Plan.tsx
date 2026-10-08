import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, Clock, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateAndSavePlan, getActivePlan } from '@/db/plans'
import type { PlanDay } from '@/db/types'
import { estimateDayMinutes } from '@/lib/generator/generate'
import { cn } from '@/lib/utils'

export function Plan() {
  const plan = useLiveQuery(getActivePlan, [])
  const [open, setOpen] = useState<number | null>(0)
  const [busy, setBusy] = useState(false)

  async function regenerate() {
    setBusy(true)
    try {
      await generateAndSavePlan()
      setOpen(0)
    } finally {
      setBusy(false)
    }
  }

  if (plan === undefined) return null

  if (!plan) {
    return (
      <>
        <PageHeader title="Plan" />
        <Card>
          <CardHeader>
            <CardTitle>No plan yet</CardTitle>
            <CardDescription>Build one from your profile and anchor lifts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled={busy} onClick={regenerate}>
              Generate plan
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <Badge variant="secondary" className="mb-2">{plan.block_type}</Badge>
          <h1 className="text-2xl font-semibold tracking-tight">{plan.name}</h1>
        </div>
        <Button variant="outline" size="sm" disabled={busy} onClick={regenerate}>
          <RefreshCw className={cn(busy && 'animate-spin')} />
          Regenerate
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{plan.summary}</p>

      <div className="space-y-2">
        {plan.days.map((day, i) => (
          <DayCard key={day.day_name} day={day} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </div>
    </>
  )
}

function DayCard({
  day, index, open, onToggle,
}: { day: PlanDay; index: number; open: boolean; onToggle: () => void }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex-1">
          <span className="block font-medium">{day.day_name}</span>
          <span className="block text-sm text-muted-foreground">
            {day.focus} · {day.exercises.length} exercises
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Clock className="size-3.5" />~{estimateDayMinutes(day)} min
        </span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-border">
          <ol className="divide-y divide-border">
            {day.exercises.map((ex) => (
              <li key={ex.name} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{ex.name}</span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {ex.sets} × {ex.reps}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {ex.muscle_group} · RIR {ex.rir} · Rest {ex.rest}
                </div>
                {ex.notes && <p className="mt-1 text-xs text-muted-foreground italic">{ex.notes}</p>}
              </li>
            ))}
          </ol>
          <div className="p-3">
            <Button className="w-full" render={<Link to={`/workout/${index}`} />}>
              Start this session
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
