import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type PersonalRecord, sessionStats } from '@/db/sessions'
import type { WorkoutLog } from '@/db/types'
import { topSet } from '@/lib/calc'

const kg = (n: number) => `${Number(n.toFixed(1))} kg`

// `detailed` lists every completed set under each exercise.
export function SessionSummary({
  log, records, detailed = false,
}: { log: WorkoutLog; records: PersonalRecord[]; detailed?: boolean }) {
  const stats = sessionStats(log)
  const done = log.exercises.filter((e) => e.sets.some((s) => s.completed))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Minutes" value={log.duration_min} />
        <Stat label="Sets" value={`${stats.completedSets}/${stats.totalSets}`} />
        <Stat label="Volume" value={stats.volume >= 1000 ? `${(stats.volume / 1000).toFixed(1)}k` : stats.volume} />
      </div>

      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-yellow-400" />
              {records.length === 1 ? 'New personal best' : `${records.length} new personal bests`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {records.map((r) => (
              <div key={r.name} className="flex justify-between">
                <span>{r.name}</span>
                <span className="tabular-nums">
                  {r.set.weight > 0 ? `${kg(r.set.weight)} × ${r.set.reps}` : `${r.set.reps} reps`}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {done.length === 0 && <p className="text-muted-foreground">No sets were completed.</p>}
          {done.map((ex) => {
            const best = topSet(ex.sets)
            const count = ex.sets.filter((s) => s.completed).length
            return (
              <div key={ex.name}>
                <div className="flex justify-between gap-3">
                  <span>{ex.name}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {count} {count === 1 ? 'set' : 'sets'}
                    {best && best.weight > 0 && ` · best ${kg(best.weight)} × ${best.reps}`}
                  </span>
                </div>
                {detailed && (
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {ex.sets
                      .filter((s) => s.completed)
                      .map((s) => (s.weight > 0 ? `${Number(s.weight.toFixed(2))}×${s.reps}` : `${s.reps}`))
                      .join(' · ')}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
