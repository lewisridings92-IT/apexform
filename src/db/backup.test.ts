import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '@/lib/options'
import { replaceAnchors } from './anchors'
import {
  backupDue, backupFileName, createBackup, describeBackup, lastBackupAt, markBackedUp, parseBackup,
  resetEverything, restoreBackup,
} from './backup'
import { db, setSetting } from './db'
import { generateAndSavePlan } from './plans'
import { saveProfile } from './profile'

async function seed() {
  await saveProfile({ ...DEFAULT_PROFILE, onboarding_complete: true })
  await replaceAnchors({ Chest: ['Pec Deck'] })
  await generateAndSavePlan()
  await db.logs.add({
    date: '2026-10-06T18:00:00Z', day_name: 'Upper A', duration_min: 60, status: 'complete',
    exercises: [{ name: 'Pec Deck', muscle_group: 'Chest', target_sets: 3, target_reps: '10-15', target_rir: '0-1',
      sets: [{ weight: 50, reps: 12, completed: true }] }],
  })
  await setSetting('restTimer', { until: 1, total: 90, label: 'x' })
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('backup round trip', () => {
  it('restores exactly what was exported, keeping ids', async () => {
    await seed()
    const backup = await createBackup(new Date('2026-10-08T12:00:00Z'))
    const json = JSON.stringify(backup)
    const before = { logs: await db.logs.toArray(), plans: await db.plans.toArray() }

    await resetEverything()
    expect(await db.logs.count()).toBe(0)

    const parsed = parseBackup(json)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    await restoreBackup(parsed.backup)

    expect(await db.logs.toArray()).toEqual(before.logs)
    expect(await db.plans.toArray()).toEqual(before.plans)
    expect((await db.profile.toArray())[0].frequency).toBe(4)
    expect(describeBackup(parsed.backup)).toEqual({ exportedAt: '2026-10-08T12:00:00.000Z', sessions: 1, plans: 1, anchors: 1 })
  })

  it('leaves out the rest timer', async () => {
    await seed()
    const backup = await createBackup()
    expect(backup.data.settings.map((s) => s.key)).not.toContain('restTimer')
  })

  it('replaces data rather than merging', async () => {
    await seed()
    const backup = await createBackup()
    await db.logs.add({ date: '2026-10-07T18:00:00Z', day_name: 'Extra', duration_min: 30, status: 'complete', exercises: [] })
    await restoreBackup(backup)
    expect((await db.logs.toArray()).map((l) => l.day_name)).toEqual(['Upper A'])
  })
})

describe('parseBackup', () => {
  const valid = () => ({
    app: 'apexform', format: 1, schema: 1, exportedAt: '2026-10-08',
    data: { profile: [], anchors: [], plans: [], logs: [], settings: [] },
  })

  it.each([
    ['not json', '{oops', /not valid JSON/],
    ['another app', JSON.stringify({ app: 'other' }), /not an ApexForm backup/],
    ['newer format', JSON.stringify({ ...valid(), format: 99 }), /newer version/],
    ['missing table', JSON.stringify({ ...valid(), data: { ...valid().data, logs: undefined } }), /missing its logs/],
    ['damaged log', JSON.stringify({ ...valid(), data: { ...valid().data, logs: [{ date: 5 }] } }), /Workout 1/],
  ])('rejects %s', (_, text, message) => {
    const r = parseBackup(text)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(message)
  })

  it('accepts an empty backup', () => {
    expect(parseBackup(JSON.stringify(valid())).ok).toBe(true)
  })
})

describe('reminder', () => {
  const now = new Date('2026-10-08T12:00:00Z')
  it('is not due with nothing to lose', () => expect(backupDue(null, 0, now)).toBe(false))
  it('is due when never backed up', () => expect(backupDue(null, 1, now)).toBe(true))
  it('is due after 7 days', () => {
    expect(backupDue('2026-10-02T12:00:00Z', 5, now)).toBe(false)
    expect(backupDue('2026-09-30T12:00:00Z', 5, now)).toBe(true)
  })

  it('records the last backup time', async () => {
    await markBackedUp(now)
    expect(await lastBackupAt()).toBe(now.toISOString())
  })
})

describe('backupFileName', () => {
  it('includes the date', () => {
    expect(backupFileName(new Date(2026, 9, 8))).toBe('apexform-backup-2026-10-08.json')
  })
})
