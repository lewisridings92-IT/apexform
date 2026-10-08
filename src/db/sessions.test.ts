import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import {
  addSet, buildSessionLog, discardSession, exerciseHint, finishSession, getInProgress, personalRecords,
  removeLastSet, sessionStats, startSession, updateSet,
} from './sessions'
import type { PlanDay, WorkoutLog } from './types'

const day: PlanDay = {
  day_name: 'Lower A',
  focus: 'Lower body',
  exercises: [
    { name: 'Back Squat', muscle_group: 'Quads', sets: 3, reps: '6-10', rir: '1-2', rest: '2-3 min' },
    { name: 'Nordic Curl', muscle_group: 'Hamstrings', sets: 2, reps: '10-15', rir: '0-1', rest: '60-90 s' },
  ],
}

const past = (date: string, squat: [number, number][], id?: number): WorkoutLog => ({
  id, date, day_name: 'Lower A', duration_min: 60, status: 'complete',
  exercises: [{
    name: 'Back Squat', muscle_group: 'Quads', target_sets: 3, target_reps: '6-10', target_rir: '1-2',
    sets: squat.map(([weight, reps]) => ({ weight, reps, completed: true })),
  }],
})

beforeEach(async () => {
  await db.logs.clear()
})

describe('buildSessionLog', () => {
  it('creates empty sets from the plan day', () => {
    const log = buildSessionLog(day, [], new Date('2026-10-08T17:00:00Z'))
    expect(log).toMatchObject({ day_name: 'Lower A', status: 'in_progress', date: '2026-10-08T17:00:00.000Z' })
    expect(log.exercises[0].sets).toEqual([1, 2, 3].map(() => ({ weight: 0, reps: 0, completed: false })))
    expect(log.exercises[0].target_rest).toBe('2-3 min')
  })

  it('prefills the suggested weight from the last session', () => {
    const log = buildSessionLog(day, [past('2026-10-06', [[100, 10], [100, 10], [100, 10]])])
    expect(log.exercises[0].sets[0].weight).toBe(105)
  })
})

describe('exerciseHint', () => {
  it('uses last session reps as placeholders, then the bottom of the range', () => {
    const logs = [past('2026-10-06', [[100, 8], [100, 7]])]
    const log = buildSessionLog(day, logs)
    expect(exerciseHint(log.exercises[0], logs).repsPlaceholder).toEqual([8, 7, 7])
    expect(exerciseHint(log.exercises[1], logs).repsPlaceholder).toEqual([10, 10])
  })
})

describe('saving sessions', () => {
  it('never creates two in-progress sessions', async () => {
    const [a, b] = await Promise.all([startSession(day, []), startSession(day, [])])
    expect(a.id).toBe(b.id)
    expect(await db.logs.count()).toBe(1)
  })

  it('finishes with a duration and clears the in-progress session', async () => {
    const log = await startSession(day, [])
    const done = await finishSession(log, new Date(new Date(log.date).getTime() + 63 * 60000))
    expect(done.duration_min).toBe(63)
    expect(await getInProgress()).toBeNull()
  })

  it('discards a session', async () => {
    const log = await startSession(day, [])
    await discardSession(log.id!)
    expect(await db.logs.count()).toBe(0)
  })
})

describe('editing', () => {
  const log = { ...buildSessionLog(day, []), id: 1 }

  it('updates one set', () => {
    const next = updateSet(log, 0, 1, { weight: 80, reps: 8, completed: true })
    expect(next.exercises[0].sets[1]).toEqual({ weight: 80, reps: 8, completed: true })
    expect(log.exercises[0].sets[1].completed).toBe(false) // unchanged original
  })

  it('adds a set copying the last weight, and keeps at least one set', () => {
    const withWeight = updateSet(log, 1, 1, { weight: 10 })
    expect(addSet(withWeight, 1).exercises[1].sets).toHaveLength(3)
    expect(addSet(withWeight, 1).exercises[1].sets[2]).toEqual({ weight: 10, reps: 0, completed: false })
    const one = removeLastSet(log, 1)
    expect(removeLastSet(one, 1).exercises[1].sets).toHaveLength(1)
  })
})

describe('summary', () => {
  it('counts completed sets and volume', () => {
    let log: WorkoutLog = { ...buildSessionLog(day, []), id: 1 }
    log = updateSet(log, 0, 0, { weight: 100, reps: 5, completed: true })
    log = updateSet(log, 0, 1, { weight: 100, reps: 5, completed: false })
    expect(sessionStats(log)).toEqual({ completedSets: 1, totalSets: 5, volume: 500 })
  })

  it('finds personal records against earlier sessions only', () => {
    const earlier = [past('2026-10-01', [[100, 8]], 1), past('2026-10-04', [[105, 6]], 2)]
    const today = { ...past('2026-10-08', [[105, 8]]), id: 3 }
    expect(personalRecords(today, earlier).map((r) => r.name)).toEqual(['Back Squat'])
    const worse = { ...past('2026-10-08', [[100, 5]]), id: 3 }
    expect(personalRecords(worse, earlier)).toEqual([])
    expect(personalRecords(today, [])).toEqual([]) // first time isn't a record
  })
})
