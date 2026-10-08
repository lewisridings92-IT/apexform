import { useLiveQuery } from 'dexie-react-hooks'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/db/db'

export function Dashboard() {
  const sessions = useLiveQuery(() => db.logs.where('status').equals('complete').count(), [])

  return (
    <>
      <PageHeader title="ApexForm" subtitle="Your training, stored on this device" />
      <Card>
        <CardHeader>
          <CardTitle>No plan yet</CardTitle>
          <CardDescription>
            Onboarding and the plan generator arrive in the next phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sessions logged: {sessions ?? '…'}
        </CardContent>
      </Card>
    </>
  )
}
