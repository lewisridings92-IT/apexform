import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ProgressChart, VolumeChart } from '@/components/charts'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db/db'
import { sessionStats } from '@/db/sessions'
import type { WorkoutLog } from '@/db/types'
import { compactKg, exerciseProgress, loggedExercises, shortDate, weeklyVolume } from '@/lib/stats'
import { cn } from '@/lib/utils'

const completedLogs = () => db.logs.where('status').equals('complete').toArray()

export function History() {
  const logs = useLiveQuery(completedLogs, [])
  const [tab, setTab] = useState<'sessions' | 'progress'>('sessions')

  if (!logs) return null

  return (
    <>
      <PageHeader title="History" />
      <div role="tablist" className="mb-4 grid grid-cols-2 rounded-lg bg-muted p-1">
        {(['sessions', 'progress'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md py-1.5 text-sm font-medium text-muted-foreground capitalize',
              tab === t && 'bg-background text-foreground shadow-sm',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'sessions' ? <SessionList logs={logs} /> : <Progress logs={logs} />}
    </>
  )
}

export function SessionList({ logs, limit }: { logs: WorkoutLog[]; limit?: number }) {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
  if (!sorted.length) {
    return <p className="text-sm text-muted-foreground">No sessions yet. Finished workouts appear here.</p>
  }
  return (
    <ul className="space-y-2">
      {sorted.map((l) => {
        const s = sessionStats(l)
        return (
          <li key={l.id}>
            <Link to={`/history/${l.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span className="flex-1">
                <span className="block font-medium">{l.day_name}</span>
                <span className="block text-sm text-muted-foreground tabular-nums">
                  {new Date(l.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}{l.duration_min} min · {s.completedSets} sets · {compactKg(s.volume)} kg
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Progress({ logs }: { logs: WorkoutLog[] }) {
  const exercises = loggedExercises(logs)
  const [picked, setPicked] = useState<string>()
  const [showTable, setShowTable] = useState(false)
  const name = picked && exercises.includes(picked) ? picked : exercises[0]
  const points = name ? exerciseProgress(name, logs) : []
  const first = points[0]
  const latest = points.at(-1)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Exercise progress</CardTitle>
          <CardDescription>Estimated 1RM uses the Epley formula on your best set each session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">Log a weighted exercise to see its progress.</p>
          ) : (
            <>
              <select
                aria-label="Exercise"
                value={name}
                onChange={(e) => setPicked(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-base"
              >
                {exercises.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>

              {latest && first && (
                <div className="grid grid-cols-2 gap-2">
                  <Tile label="Estimated 1RM" value={`${Math.round(latest.e1rm)} kg`} />
                  <Tile
                    label={points.length > 1 ? `Since ${shortDate(first.date)}` : 'Sessions'}
                    value={points.length > 1 ? signed(latest.e1rm - first.e1rm) : '1'}
                  />
                </div>
              )}

              {points.length >= 2 ? (
                <>
                  <ProgressChart points={points} />
                  <Button variant="ghost" size="sm" onClick={() => setShowTable(!showTable)}>
                    {showTable ? 'Hide table' : 'Show as table'}
                  </Button>
                  {showTable && (
                    <table className="w-full text-sm tabular-nums">
                      <thead className="text-xs text-muted-foreground">
                        <tr><th className="text-left font-normal">Date</th><th className="text-right font-normal">Best set</th><th className="text-right font-normal">Top kg</th><th className="text-right font-normal">e1RM</th></tr>
                      </thead>
                      <tbody>
                        {[...points].reverse().map((p) => (
                          <tr key={p.date} className="border-t border-border">
                            <td className="py-1.5">{shortDate(p.date)}</td>
                            <td className="text-right">{p.topSet.weight} × {p.topSet.reps}</td>
                            <td className="text-right">{p.topWeight}</td>
                            <td className="text-right">{Math.round(p.e1rm)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Log this exercise in 2 or more sessions to see a chart.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly volume</CardTitle>
          <CardDescription>Weight × reps over completed sets, last 12 weeks.</CardDescription>
        </CardHeader>
        <CardContent>
          <VolumeChart weeks={weeklyVolume(logs)} />
        </CardContent>
      </Card>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function signed(n: number): string {
  const r = Math.round(n * 10) / 10
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r)} kg`
}
