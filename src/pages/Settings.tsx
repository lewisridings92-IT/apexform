import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isInstalled, isStoragePersisted, requestPersistentStorage } from '@/db/storage'

export function Settings() {
  const [persisted, setPersisted] = useState<boolean>()
  const installed = isInstalled()

  useEffect(() => {
    requestPersistentStorage().then(() => isStoragePersisted().then(setPersisted))
  }, [])

  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Device storage</CardTitle>
          <CardDescription>
            Your data only exists on this phone. Backups arrive in Phase 7.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Opened from home screen" ok={installed} />
          <Row label="Protected from clearing" ok={persisted} />
          {!installed && (
            <p className="text-muted-foreground">
              In Safari, tap Share → Add to Home Screen, then always open ApexForm from that icon.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function Row({ label, ok }: { label: string; ok: boolean | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      {ok === undefined ? (
        <Badge variant="outline">Checking…</Badge>
      ) : (
        <Badge variant={ok ? 'secondary' : 'destructive'}>{ok ? 'Yes' : 'No'}</Badge>
      )}
    </div>
  )
}
