import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db/db'
import { getProfile } from '@/db/profile'
import { goalLabel } from '@/lib/options'

export function Dashboard() {
  const profile = useLiveQuery(getProfile, [])
  const sessions = useLiveQuery(() => db.logs.where('status').equals('complete').count(), [])

  const goal = profile?.goals[0]
  return (
    <>
      <PageHeader
        title={goal ? `${goalLabel(goal)} Block` : 'ApexForm'}
        subtitle={profile ? `${profile.frequency} days a week · ${profile.session_length} min sessions` : undefined}
      />
      <Card>
        <CardHeader>
          <CardTitle>No plan yet</CardTitle>
          <CardDescription>
            Anchor lifts and the plan generator arrive in the next phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sessions logged: {sessions ?? '…'}
        </CardContent>
      </Card>
    </>
  )
}
