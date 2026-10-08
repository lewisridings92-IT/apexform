import { Check, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { NumberField } from '@/components/NumberField'
import { RestTimer, type RestState } from '@/components/RestTimer'
import { SessionSummary } from '@/components/SessionSummary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db, getSetting, setSetting } from '@/db/db'
import { useNow } from '@/hooks/useNow'
import { formatClock } from '@/lib/time'
import { getActivePlan } from '@/db/plans'
import {
  addSet, discardSession, exerciseHint, finishSession, getInProgress, type PersonalRecord,
  personalRecords, removeLastSet, saveSession, sessionStats, startSession, updateSet,
} from '@/db/sessions'
import type { LoggedExercise, LoggedSet, PlanDay, WorkoutLog } from '@/db/types'
import { isTimed } from '@/lib/exercises'
import { parseRestSec } from '@/lib/generator/generate'
import { cn } from '@/lib/utils'

const REST_KEY = 'restTimer'

type Conflict = { current: WorkoutLog; wanted: PlanDay }

export function Workout() {
  const navigate = useNavigate()
  const { dayIndex } = useParams()
  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [history, setHistory] = useState<WorkoutLog[]>([])
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [finished, setFinished] = useState<{ log: WorkoutLog; records: PersonalRecord[] } | null>(null)
  const [rest, setRestState] = useState<RestState | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Load or start the session. startSession is safe to call twice.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [plan, current, done, savedRest] = await Promise.all([
        getActivePlan(),
        getInProgress(),
        db.logs.where('status').equals('complete').toArray(),
        getSetting<RestState>(REST_KEY),
      ])
      if (cancelled) return
      setHistory(done)
      if (savedRest && savedRest.until > Date.now() - 60_000) setRestState(savedRest)

      const wanted = dayIndex !== undefined ? plan?.days[Number(dayIndex)] : undefined
      if (current) {
        if (wanted && wanted.day_name !== current.day_name) setConflict({ current, wanted })
        else setLog(current)
        return
      }
      if (!wanted) return navigate('/', { replace: true })
      const started = await startSession(wanted, done)
      if (!cancelled) setLog(started)
    })()
    return () => {
      cancelled = true
    }
  }, [dayIndex, navigate])

  function setRest(next: RestState | null) {
    setRestState(next)
    setSetting(REST_KEY, next)
  }

  // Every change is saved straight away, so nothing is lost if the app closes.
  function change(next: WorkoutLog) {
    setLog(next)
    saveSession(next)
  }

  async function finish() {
    if (!log) return
    const done = await finishSession(log)
    setRest(null)
    setFinished({ log: done, records: personalRecords(done, history) })
  }

  async function discard() {
    if (!log?.id) return
    await discardSession(log.id)
    setRest(null)
    navigate('/', { replace: true })
  }

  if (finished) {
    return (
      <>
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Session complete</h1>
          <p className="text-sm text-muted-foreground">{finished.log.day_name}</p>
        </header>
        <SessionSummary log={finished.log} records={finished.records} />
        <Button size="lg" className="mt-6 w-full" render={<Link to="/" replace />}>
          Done
        </Button>
      </>
    )
  }

  if (conflict) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unfinished session</CardTitle>
          <CardDescription>
            You have an unfinished {conflict.current.day_name} session from{' '}
            {new Date(conflict.current.date).toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="w-full"
            onClick={() => {
              setLog(conflict.current)
              setConflict(null)
              navigate('/workout', { replace: true })
            }}
          >
            Resume {conflict.current.day_name}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await discardSession(conflict.current.id!)
              setLog(await startSession(conflict.wanted, history))
              setConflict(null)
            }}
          >
            Discard it and start {conflict.wanted.day_name}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!log) return null

  const stats = sessionStats(log)
  return (
    <>
      <SessionHeader log={log} completed={stats.completedSets} total={stats.totalSets} onFinish={finish} />

      <div className="space-y-3">
        {log.exercises.map((ex, i) => (
          <ExerciseCard
            key={`${ex.name}-${i}`}
            ex={ex}
            history={history}
            onSet={(j, patch) => {
              const next = updateSet(log, i, j, patch)
              change(next)
              if (patch.completed && sessionStats(next).completedSets < stats.totalSets) {
                const total = parseRestSec(ex.target_rest ?? '90 s')
                setRest({ until: Date.now() + total * 1000, total, label: ex.name })
              }
            }}
            onAddSet={() => change(addSet(log, i))}
            onRemoveSet={() => change(removeLastSet(log, i))}
          />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        <Button size="lg" className="w-full" disabled={stats.completedSets === 0} onClick={finish}>
          Finish session
        </Button>
        {confirmDiscard ? (
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1" onClick={discard}>
              Yes, discard it
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDiscard(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setConfirmDiscard(true)}>
            Discard session
          </Button>
        )}
      </div>

      {rest && (
        <RestTimer
          rest={rest}
          onAdjust={(s) => setRest({ ...rest, until: rest.until + s * 1000, total: Math.max(1, rest.total + s) })}
          onDone={() => setRest(null)}
        />
      )}
    </>
  )
}

function SessionHeader({
  log, completed, total, onFinish,
}: { log: WorkoutLog; completed: number; total: number; onFinish: () => void }) {
  const now = useNow()
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border bg-background/95 px-4 pt-[env(safe-area-inset-top)] pb-3 backdrop-blur">
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{log.day_name}</h1>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatClock((now - new Date(log.date).getTime()) / 1000)} · {completed}/{total} sets
          </p>
        </div>
        <Button size="sm" disabled={completed === 0} onClick={onFinish}>
          Finish
        </Button>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
      </div>
    </header>
  )
}

function ExerciseCard({
  ex, history, onSet, onAddSet, onRemoveSet,
}: {
  ex: LoggedExercise
  history: WorkoutLog[]
  onSet: (setIndex: number, patch: Partial<LoggedSet>) => void
  onAddSet: () => void
  onRemoveSet: () => void
}) {
  const hint = useMemo(() => exerciseHint(ex, history), [ex, history])
  const timed = isTimed(ex.name)
  const allDone = ex.sets.every((s) => s.completed)

  return (
    <section className={cn('rounded-xl border border-border bg-card', allDone && 'opacity-70')}>
      <div className="px-4 pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-medium">{ex.name}</h2>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {ex.target_sets} × {ex.target_reps}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          RIR {ex.target_rir}
          {ex.target_rest && ` · Rest ${ex.target_rest}`}
        </p>
        {hint.note && <p className="mt-1 text-xs text-muted-foreground italic">{hint.note}</p>}
      </div>

      <div className="px-2 pt-2 pb-1">
        <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] gap-2 px-2 pb-1 text-xs text-muted-foreground">
          <span>Set</span>
          <span className="text-center">kg</span>
          <span className="text-center">{timed ? 'sec' : 'reps'}</span>
          <span />
        </div>
        {ex.sets.map((s, j) => (
          <div
            key={j}
            className={cn('grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 rounded-lg px-2 py-1', s.completed && 'bg-primary/10')}
          >
            <span className="text-sm text-muted-foreground tabular-nums">{j + 1}</span>
            <NumberField
              decimal
              value={s.weight}
              placeholder="0"
              aria-label={`Set ${j + 1} weight in kg`}
              onChange={(weight) => onSet(j, { weight })}
            />
            <NumberField
              value={s.reps}
              placeholder={String(hint.repsPlaceholder[j])}
              aria-label={`Set ${j + 1} ${timed ? 'seconds' : 'reps'}`}
              onChange={(reps) => onSet(j, { reps })}
            />
            <button
              type="button"
              role="checkbox"
              aria-checked={s.completed}
              aria-label={`Set ${j + 1} done`}
              // Ticking an empty set fills in the suggested reps.
              onClick={() =>
                onSet(j, s.completed ? { completed: false } : { completed: true, reps: s.reps || hint.repsPlaceholder[j] })
              }
              className={cn(
                'flex h-10 items-center justify-center rounded-lg border border-border',
                s.completed && 'border-primary bg-primary text-primary-foreground',
              )}
            >
              <Check className="size-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 px-4 pt-1 pb-3">
        <Button variant="ghost" size="sm" onClick={onAddSet}>
          <Plus /> Add set
        </Button>
        <Button variant="ghost" size="sm" disabled={ex.sets.length <= 1} onClick={onRemoveSet}>
          <Minus /> Remove set
        </Button>
      </div>
    </section>
  )
}
