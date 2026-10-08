import { describe, expect, it } from 'vitest'
import type { WorkoutLog } from '@/db/types'
import { history, isStalled, parseRepRange, suggestNext, weightIncrement } from './progression'

const log = (date: string, sets: [number, number][], status: WorkoutLog['status'] = 'complete'): WorkoutLog => ({
  date, day_name: 'Lower A', duration_min: 60, status,
  exercises: [{
    name: 'Back Squat', muscle_group: 'Quads', target_sets: 3, target_reps: '6-10', target_rir: '1-2',
    sets: sets.map(([weight, reps]) => ({ weight, reps, completed: true })),
  }],
})

const squat = { name: 'Back Squat', equipment: 'Barbell', muscle_group: 'Quads', compound: true } as const

describe('parseRepRange', () => {
  it.each([['6-10', { min: 6, max: 10 }], ['8', { min: 8, max: 8 }], ['30-45 s', null]])('%s', (reps, range) => {
    expect(parseRepRange(reps)).toEqual(range)
  })
})

describe('history', () => {
  it('lists completed sessions newest first and skips unfinished ones', () => {
    const h = history('Back Squat', [
      log('2026-10-01', [[100, 8]]),
      log('2026-10-06', [[105, 8]]),
      log('2026-10-08', [[110, 8]], 'in_progress'),
    ])
    expect(h.map((p) => p.date)).toEqual(['2026-10-06', '2026-10-01'])
  })
})

describe('suggestNext', () => {
  it('adds 5 kg to a barbell squat after hitting the top of the range', () => {
    const s = suggestNext(squat, '6-10', [log('2026-10-06', [[100, 10], [100, 10]])])
    expect(s).toEqual({ weight: 105, note: 'Last time: 100 kg × 10, top of the range. Try 105 kg.' })
  })

  it('keeps the weight when reps are inside the range', () => {
    expect(suggestNext(squat, '6-10', [log('2026-10-06', [[100, 8]])])?.note).toMatch(/more reps at the same weight/)
  })

  it('holds the weight when below the range', () => {
    expect(suggestNext(squat, '6-10', [log('2026-10-06', [[100, 4]])])?.note).toMatch(/until you reach 6 reps/)
  })

  it('returns null with no history', () => {
    expect(suggestNext(squat, '6-10', [])).toBeNull()
  })
})

describe('weightIncrement', () => {
  it('uses smaller jumps for upper body and dumbbells', () => {
    expect(weightIncrement('Barbell', 'Chest', true)).toBe(2.5)
    expect(weightIncrement('Dumbbell', 'Quads', true)).toBe(2)
    expect(weightIncrement('Bodyweight', 'Back', true)).toBe(0)
  })
})

describe('isStalled', () => {
  it('needs three sessions', () => {
    expect(isStalled('Back Squat', [log('2026-10-01', [[100, 8]]), log('2026-10-03', [[100, 8]])])).toBe(false)
  })
  it('is true when the best set has not improved', () => {
    const logs = [log('2026-10-01', [[100, 8]]), log('2026-10-03', [[100, 7]]), log('2026-10-06', [[100, 8]])]
    expect(isStalled('Back Squat', logs)).toBe(true)
  })
  it('is false when the best set improved', () => {
    const logs = [log('2026-10-01', [[100, 8]]), log('2026-10-03', [[100, 8]]), log('2026-10-06', [[102.5, 8]])]
    expect(isStalled('Back Squat', logs)).toBe(false)
  })
})
