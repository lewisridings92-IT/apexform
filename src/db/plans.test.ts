import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '@/lib/options'
import { replaceAnchors } from './anchors'
import { db } from './db'
import { generateAndSavePlan, getActivePlan, recentLogs } from './plans'
import { saveProfile } from './profile'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
})

describe('plans', () => {
  it('refuses to generate before onboarding', async () => {
    await expect(generateAndSavePlan()).rejects.toThrow(/onboarding/)
  })

  it('keeps exactly one active plan and archives the old one', async () => {
    await saveProfile({ ...DEFAULT_PROFILE, onboarding_complete: true })
    const first = await generateAndSavePlan()
    await replaceAnchors({ Quads: ['Hack Squat'] })
    const second = await generateAndSavePlan()

    expect(await db.plans.where('status').equals('active').count()).toBe(1)
    expect((await getActivePlan())?.id).toBe(second.id)
    expect((await db.plans.get(first.id!))?.status).toBe('archived')
    expect(second.days.flatMap((d) => d.exercises.map((e) => e.name))).toContain('Hack Squat')
  })

  it('returns recent completed logs, newest first', async () => {
    await db.logs.bulkAdd(
      ['2026-10-01', '2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'].map((date) => ({
        date, day_name: 'A', duration_min: 60, status: 'complete' as const, exercises: [],
      })),
    )
    await db.logs.add({ date: '2026-10-10', day_name: 'A', duration_min: 0, status: 'in_progress', exercises: [] })
    const logs = await recentLogs()
    expect(logs.map((l) => l.date)).toEqual(['2026-10-09', '2026-10-08', '2026-10-07', '2026-10-06', '2026-10-05', '2026-10-03'])
  })
})
