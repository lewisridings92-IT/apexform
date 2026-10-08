import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { SessionSummary } from '@/components/SessionSummary'
import { Button } from '@/components/ui/button'
import { db } from '@/db/db'
import { discardSession, personalRecords } from '@/db/sessions'

export function SessionDetail() {
  const navigate = useNavigate()
  const id = Number(useParams().id)
  const log = useLiveQuery(() => db.logs.get(id), [id])
  const all = useLiveQuery(() => db.logs.where('status').equals('complete').toArray(), [])
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (log === undefined || !all) return null // loading, or deleted

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" render={<Link to="/history" />}>
        <ChevronLeft /> History
      </Button>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{log.day_name}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(log.date).toLocaleString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </header>

      <SessionSummary log={log} records={personalRecords(log, all)} detailed />

      <div className="mt-6">
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              Delete this session? It will be removed from your history and progress charts.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={async () => {
                  navigate('/history', { replace: true })
                  await discardSession(id)
                }}
              >
                Yes, delete it
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setConfirmDelete(true)}>
            Delete session
          </Button>
        )}
      </div>
    </>
  )
}
