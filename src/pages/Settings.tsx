import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type Backup, backupDue, backupFileName, createBackup, daysSince, describeBackup, lastBackupAt, markBackedUp,
  parseBackup, resetEverything, restoreBackup,
} from '@/db/backup'
import { db } from '@/db/db'
import { addDemoHistory, removeDemoHistory } from '@/db/demo'
import { generateAndSavePlan } from '@/db/plans'
import { isInstalled, isStoragePersisted, requestPersistentStorage } from '@/db/storage'
import { saveFile } from '@/lib/share'
import { shortDate } from '@/lib/stats'

export function Settings() {
  const navigate = useNavigate()
  const [regenerating, setRegenerating] = useState(false)

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <BackupCard />
        <StorageCard />

        <Card>
          <CardHeader>
            <CardTitle>Training profile</CardTitle>
            <CardDescription>Days, session length, equipment, goals and experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" render={<Link to="/onboarding" />}>
              Edit profile
            </Button>
            <Button variant="outline" className="w-full" render={<Link to="/anchors" />}>
              Edit anchor lifts
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={regenerating}
              onClick={async () => {
                setRegenerating(true)
                await generateAndSavePlan().finally(() => setRegenerating(false))
                navigate('/plan')
              }}
            >
              Regenerate plan from recent sessions
            </Button>
          </CardContent>
        </Card>

        <ResetCard />
        {import.meta.env.DEV && <DevTools />}
      </div>
    </>
  )
}

// ── Backup ───────────────────────────────────────────────────────────────────

function BackupCard() {
  const last = useLiveQuery(lastBackupAt, [])
  const sessions = useLiveQuery(() => db.logs.where('status').equals('complete').count(), [])
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [busy, setBusy] = useState(false)

  async function exportBackup() {
    setBusy(true)
    setMessage(null)
    try {
      const backup = await createBackup()
      const result = await saveFile(JSON.stringify(backup), backupFileName())
      if (result === 'cancelled') return
      await markBackedUp()
      setMessage({
        text: result === 'shared'
          ? 'Backup saved. Keep it somewhere off this phone, such as iCloud Drive.'
          : 'Backup downloaded.',
      })
    } catch (e) {
      setMessage({ text: `Backup failed: ${e instanceof Error ? e.message : String(e)}`, error: true })
    } finally {
      setBusy(false)
    }
  }

  async function pickFile(file: File | undefined) {
    if (!file) return
    setMessage(null)
    const result = parseBackup(await file.text())
    if (result.ok) setPending(result.backup)
    else setMessage({ text: result.error, error: true })
  }

  async function restore() {
    if (!pending) return
    setBusy(true)
    try {
      await restoreBackup(pending)
      setMessage({ text: 'Backup restored.' })
      setPending(null)
    } catch (e) {
      setMessage({ text: `Restore failed, nothing was changed: ${e instanceof Error ? e.message : String(e)}`, error: true })
    } finally {
      setBusy(false)
    }
  }

  const due = last !== undefined && sessions !== undefined && backupDue(last, sessions)
  const info = pending && describeBackup(pending)

  return (
    <Card id="backup">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Backup
          {due && <Badge variant="destructive">Due</Badge>}
        </CardTitle>
        <CardDescription>
          Your data only exists on this phone. Save a backup file to iCloud Drive regularly so you can restore it on
          a new or reset phone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          Last backup:{' '}
          <span className="text-muted-foreground">
            {last ? `${shortDate(last)} (${ago(daysSince(last))})` : 'never'}
          </span>
        </p>

        {info ? (
          <div className="space-y-3 rounded-lg border border-border p-3 text-sm">
            <p>
              Backup from <strong>{shortDate(info.exportedAt)}</strong>: {info.sessions} sessions, {info.plans}{' '}
              {info.plans === 1 ? 'plan' : 'plans'}, {info.anchors} anchor lifts.
            </p>
            <p className="text-muted-foreground">
              Restoring <strong>replaces everything</strong> currently on this phone with this backup.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" disabled={busy} onClick={restore}>
                Replace and restore
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={busy} onClick={exportBackup}>
              Export backup
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
              Restore…
            </Button>
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0])
            e.target.value = '' // allow picking the same file again
          }}
        />
        {message && (
          <p role="status" className={message.error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ago(days: number): string {
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

// ── Storage status ───────────────────────────────────────────────────────────

function StorageCard() {
  const [persisted, setPersisted] = useState<boolean>()
  const installed = isInstalled()

  useEffect(() => {
    requestPersistentStorage().then(() => isStoragePersisted().then(setPersisted))
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device storage</CardTitle>
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

// ── Reset ────────────────────────────────────────────────────────────────────

function ResetCard() {
  const navigate = useNavigate()
  const sessions = useLiveQuery(() => db.logs.where('status').equals('complete').count(), [])
  const [confirming, setConfirming] = useState(false)

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Danger zone</CardTitle>
        <CardDescription>Start again from scratch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {confirming ? (
          <>
            <p className="text-sm">
              This permanently deletes your profile, anchor lifts, plans and{' '}
              <strong>{sessions ?? 0} logged sessions</strong> from this phone. Export a backup first if you might want
              them back.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={async () => {
                  await resetEverything()
                  navigate('/onboarding', { replace: true })
                }}
              >
                Delete everything
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <Button variant="destructive" className="w-full" onClick={() => setConfirming(true)}>
            Reset everything
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ── Developer (dev server only; removed from the phone build) ────────────────

function DevTools() {
  const [status, setStatus] = useState('')
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>Developer</CardTitle>
        <CardDescription>Only shown on the PC dev server.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            try {
              setStatus(`Added ${await addDemoHistory()} sample sessions.`)
            } catch (e) {
              setStatus(e instanceof Error ? e.message : String(e))
            }
          }}
        >
          Load sample history (8 weeks)
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await removeDemoHistory()
            setStatus('Sample sessions removed.')
          }}
        >
          Remove sample history
        </Button>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  )
}
