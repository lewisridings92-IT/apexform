import { beforeEach, describe, expect, it } from 'vitest'
import { db, getSetting, setSetting } from './db'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('local database', () => {
  it('saves and reads a workout log', async () => {
    const id = await db.logs.add({
      date: '2026-10-08T10:00:00Z', day_name: 'Upper A', duration_min: 62, status: 'complete',
      exercises: [{ name: 'Barbell Bench Press', muscle_group: 'Chest', target_sets: 3,
        target_reps: '6-8', target_rir: '1-2', sets: [{ weight: 90, reps: 8, completed: true }] }],
    })
    const log = await db.logs.get(id)
    expect(log?.exercises[0].sets[0].weight).toBe(90)
  })

  it('queries logs by status', async () => {
    await db.logs.bulkAdd([
      { date: '2026-10-01', day_name: 'A', duration_min: 50, status: 'complete', exercises: [] },
      { date: '2026-10-08', day_name: 'B', duration_min: 0, status: 'in_progress', exercises: [] },
    ])
    expect(await db.logs.where('status').equals('in_progress').count()).toBe(1)
  })

  it('stores settings by key', async () => {
    await setSetting('lastBackupAt', '2026-10-08')
    expect(await getSetting<string>('lastBackupAt')).toBe('2026-10-08')
  })
})
