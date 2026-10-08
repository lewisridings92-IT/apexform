import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Clock, Play } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db/db'
import { generateAndSavePlan, getActivePlan } from '@/db/plans'
import { getProfile } from '@/db/profile'
import { getInProgress } from '@/db/sessions'
import { estimateDayMinutes } from '@/lib/generator/generate'
import { goalLabel } from '@/lib/options'
import { compactKg, totalVolume } from '@/lib/stats'
import { SessionList } from './History'

export function Dashboard() {
  const profile = useLiveQuery(getProfile, [])
  const plan = useLiveQuery(getActivePlan, [])
  const logs = useLiveQuery(() => db.logs.where('status').equals('complete').toArray(), [])
  const inProgress = useLiveQuery(getInProgress, [])
  const [busy, setBusy] = useState(false)

  const goal = profile?.goals[0]
  return (
    <>
      <PageHeader
        title={goal ? `${goalLabel(goal)} Block` : 'ApexForm'}
        subtitle={profile ? `${profile.frequency} days a week · ${profile.session_length} min sessions` : undefined}
      />

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Sessions" value={logs?.length ?? '…'} />
        <Stat label="Volume (kg)" value={logs ? compactKg(totalVolume(logs)) : '…'} />
        <Stat label="Plan days" value={plan?.days.length ?? '–'} />
      </div>

      {inProgress && (
        <Link
          to="/workout"
          className="mb-4 flex items-center gap-3 rounded-xl border border-primary bg-primary/10 px-4 py-3"
        >
          <Play className="size-5" />
          <span className="flex-1">
            <span className="block font-medium">Resume {inProgress.day_name}</span>
            <span className="block text-sm text-muted-foreground">
              Started {new Date(inProgress.date).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </span>
          <ChevronRight className="size-4" />
        </Link>
      )}

      {plan === null && (
        <Card>
          <CardHeader>
            <CardTitle>No plan yet</CardTitle>
            <CardDescription>Build one from your profile and anchor lifts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await generateAndSavePlan().finally(() => setBusy(false))
              }}
            >
              Generate plan
            </Button>
          </CardContent>
        </Card>
      )}

      {plan && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">{plan.name}</h2>
          <div className="space-y-2">
            {plan.days.map((day, i) => (
              <Link
                key={day.day_name}
                to={`/workout/${i}`}
                aria-label={`Start ${day.day_name}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="flex-1">
                  <span className="block font-medium">{day.day_name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {day.exercises.slice(0, 3).map((e) => e.name).join(', ')}
                    {day.exercises.length > 3 && ` +${day.exercises.length - 3}`}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <Clock className="size-3.5" />~{estimateDayMinutes(day)}
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                  <Play className="size-3" /> Start
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {logs && logs.length > 0 && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Recent sessions</h2>
            <Link to="/history" className="text-sm text-muted-foreground">See all</Link>
          </div>
          <SessionList logs={logs} limit={5} />
        </section>
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-3">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
