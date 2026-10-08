import { describe, expect, it } from 'vitest'
import { e1rm, logVolume, setsVolume, topSet } from './calc'

describe('e1rm', () => {
  it('uses the Epley formula', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 2)
  })
  it('returns the weight for a single', () => {
    expect(e1rm(140, 1)).toBe(140)
  })
  it('returns 0 for empty sets', () => {
    expect(e1rm(0, 5)).toBe(0)
    expect(e1rm(100, 0)).toBe(0)
  })
})

describe('volume', () => {
  const sets = [
    { weight: 100, reps: 5, completed: true },
    { weight: 100, reps: 5, completed: true },
    { weight: 100, reps: 5, completed: false },
  ]
  it('counts only completed sets', () => {
    expect(setsVolume(sets)).toBe(1000)
  })
  it('sums across exercises', () => {
    expect(
      logVolume({
        date: '2026-10-08T10:00:00Z', day_name: 'Upper', duration_min: 60, status: 'complete',
        exercises: [
          { name: 'Bench', muscle_group: 'Chest', target_sets: 3, target_reps: '5', target_rir: '2', sets },
          { name: 'Row', muscle_group: 'Back', target_sets: 1, target_reps: '10', target_rir: '2',
            sets: [{ weight: 60, reps: 10, completed: true }] },
        ],
      }),
    ).toBe(1600)
  })
})

describe('topSet', () => {
  it('picks the completed set with the best e1RM', () => {
    const best = topSet([
      { weight: 100, reps: 8, completed: true }, // 126.7
      { weight: 120, reps: 3, completed: true }, // 132
      { weight: 140, reps: 3, completed: false },
    ])
    expect(best).toEqual({ weight: 120, reps: 3, completed: true })
  })
})
