import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '@/lib/options'
import { exerciseProgress } from '@/lib/stats'
import { db } from './db'
import { addDemoHistory, removeDemoHistory } from './demo'
import { generateAndSavePlan } from './plans'
import { saveProfile } from './profile'

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await saveProfile({ ...DEFAULT_PROFILE, onboarding_complete: true })
})

describe('demo history', () => {
  it('adds sessions with progress, and removes only those sessions', async () => {
    const plan = await generateAndSavePlan()
    await db.logs.add({ date: '2020-01-01T00:00:00Z', day_name: 'Real', duration_min: 50, status: 'complete', exercises: [] })

    const added = await addDemoHistory(8)
    expect(added).toBe(8 * plan.days.length)

    const logs = await db.logs.toArray()
    const points = exerciseProgress(plan.days[0].exercises[0].name, logs)
    expect(points.length).toBeGreaterThanOrEqual(8)
    expect(points.at(-1)!.topWeight).toBeGreaterThan(points[0].topWeight)

    await removeDemoHistory()
    expect((await db.logs.toArray()).map((l) => l.day_name)).toEqual(['Real'])
  })
})
