import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db/db'
import { generateAndSavePlan, getActivePlan } from '@/db/plans'
import { getProfile } from '@/db/profile'
import { estimateDayMinutes } from '@/lib/generator/generate'
import { goalLabel } from '@/lib/options'

export function Dashboard() {
  const profile = useLiveQuery(getProfile, [])
  const plan = useLiveQuery(getActivePlan, [])
  const sessions = useLiveQuery(() => db.logs.where('status').equals('complete').count(), [])
  const [busy, setBusy] = useState(false)

  const goal = profile?.goals[0]
  return (
    <>
      <PageHeader
        title={goal ? `${goalLabel(goal)} Block` : 'ApexForm'}
        subtitle={profile ? `${profile.frequency} days a week · ${profile.session_length} min sessions` : undefined}
      />

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat label="Sessions" value={sessions ?? '…'} />
        <Stat label="Plan days" value={plan?.days.length ?? '–'} />
      </div>

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
        <>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">{plan.name}</h2>
          <div className="space-y-2">
            {plan.days.map((day) => (
              <Link
                key={day.day_name}
                to="/plan"
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
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
