import { db, getSetting, setSetting } from './db'
import type { AnchorExercise, Setting, UserProfile, WorkoutLog, WorkoutPlan } from './types'

// Bump only if the backup layout changes; the Dexie schema version is stored alongside.
const FORMAT = 1
const LAST_BACKUP_KEY = 'lastBackupAt'
// Short-lived state that should not be restored from a backup.
const SKIP_SETTINGS = new Set(['restTimer'])

export interface Backup {
  app: 'apexform'
  format: number
  schema: number
  exportedAt: string
  data: {
    profile: UserProfile[]
    anchors: AnchorExercise[]
    plans: WorkoutPlan[]
    logs: WorkoutLog[]
    settings: Setting[]
  }
}

export async function createBackup(now = new Date()): Promise<Backup> {
  return db.transaction('r', db.tables, async () => ({
    app: 'apexform' as const,
    format: FORMAT,
    schema: db.verno,
    exportedAt: now.toISOString(),
    data: {
      profile: await db.profile.toArray(),
      anchors: await db.anchors.toArray(),
      plans: await db.plans.toArray(),
      logs: await db.logs.toArray(),
      settings: (await db.settings.toArray()).filter((s) => !SKIP_SETTINGS.has(s.key)),
    },
  }))
}

export function backupFileName(now = new Date()): string {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return `apexform-backup-${d}.json`
}

export async function markBackedUp(now = new Date()): Promise<void> {
  await setSetting(LAST_BACKUP_KEY, now.toISOString())
}

export async function lastBackupAt(): Promise<string | null> {
  return (await getSetting<string>(LAST_BACKUP_KEY)) ?? null
}

// ── Checking a file before restoring it ──────────────────────────────────────

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown) => typeof v === 'string'
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)

// Returns the backup if it looks valid, or a message describing the first problem.
export function parseBackup(text: string): { ok: true; backup: Backup } | { ok: false; error: string } {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not a backup (it is not valid JSON).' }
  }
  if (!isObj(raw) || raw.app !== 'apexform') return { ok: false, error: 'This file is not an ApexForm backup.' }
  if (!isNum(raw.format) || (raw.format as number) > FORMAT)
    return { ok: false, error: 'This backup was made by a newer version of the app.' }
  if (isNum(raw.schema) && (raw.schema as number) > db.verno)
    return { ok: false, error: 'This backup was made by a newer version of the app.' }
  if (!isObj(raw.data)) return { ok: false, error: 'The backup has no data.' }

  const data = raw.data
  for (const table of ['profile', 'anchors', 'plans', 'logs', 'settings']) {
    if (!Array.isArray(data[table])) return { ok: false, error: `The backup is missing its ${table}.` }
  }
  const logs = data.logs as unknown[]
  const badLog = logs.findIndex(
    (l) => !isObj(l) || !isStr(l.date) || !isStr(l.day_name) || !Array.isArray(l.exercises) ||
      !(l.exercises as unknown[]).every((e) => isObj(e) && isStr(e.name) && Array.isArray(e.sets)),
  )
  if (badLog >= 0) return { ok: false, error: `Workout ${badLog + 1} in the backup is damaged.` }
  const plans = data.plans as unknown[]
  if (!plans.every((p) => isObj(p) && isStr(p.name) && Array.isArray(p.days)))
    return { ok: false, error: 'A plan in the backup is damaged.' }
  const profiles = data.profile as unknown[]
  if (!profiles.every((p) => isObj(p) && isNum(p.frequency) && Array.isArray(p.equipment)))
    return { ok: false, error: 'The profile in the backup is damaged.' }

  return { ok: true, backup: raw as unknown as Backup }
}

export function describeBackup(b: Backup) {
  return {
    exportedAt: b.exportedAt,
    sessions: b.data.logs.filter((l) => l.status === 'complete').length,
    plans: b.data.plans.length,
    anchors: b.data.anchors.length,
  }
}

// ── Restoring and resetting ──────────────────────────────────────────────────

// Replaces everything on this device with the backup, in one transaction.
export async function restoreBackup(b: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.profile.bulkPut(b.data.profile)
    await db.anchors.bulkPut(b.data.anchors)
    await db.plans.bulkPut(b.data.plans)
    await db.logs.bulkPut(b.data.logs)
    await db.settings.bulkPut(b.data.settings.filter((s) => !SKIP_SETTINGS.has(s.key)))
  })
}

export async function resetEverything(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })
}

// ── Reminder ─────────────────────────────────────────────────────────────────

export const BACKUP_REMINDER_DAYS = 7

// Due once there is something to lose and the last backup is old (or missing).
export function backupDue(lastBackup: string | null, completedSessions: number, now = new Date()): boolean {
  if (completedSessions === 0) return false
  if (!lastBackup) return true
  return now.getTime() - new Date(lastBackup).getTime() > BACKUP_REMINDER_DAYS * 86_400_000
}

export function daysSince(iso: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
}
