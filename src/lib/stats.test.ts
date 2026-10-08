import { describe, expect, it } from 'vitest'
import type { WorkoutLog } from '@/db/types'
import { compactKg, exerciseProgress, loggedExercises, totalVolume, weeklyVolume, weekStart } from './stats'

const log = (date: string, exercises: [string, [number, number, boolean?][]][], status: WorkoutLog['status'] = 'complete'): WorkoutLog => ({
  date, day_name: 'A', duration_min: 60, status,
  exercises: exercises.map(([name, sets]) => ({
    name, muscle_group: 'Chest', target_sets: 3, target_reps: '6-10', target_rir: '1-2',
    sets: sets.map(([weight, reps, completed = true]) => ({ weight, reps, completed })),
  })),
})

const logs = [
  log('2026-10-06T18:00:00Z', [['Bench', [[100, 5], [90, 10]]], ['Push-Up', [[0, 20]]]]),
  log('2026-09-29T18:00:00Z', [['Bench', [[95, 5], [110, 1, false]]], ['Row', [[60, 10]]]]),
  log('2026-10-08T18:00:00Z', [['Bench', [[120, 5]]]], 'in_progress'),
]

describe('exerciseProgress', () => {
  it('gives one point per completed session, oldest first, ignoring unfinished sets', () => {
    const points = exerciseProgress('Bench', logs)
    expect(points.map((p) => p.date)).toEqual(['2026-09-29T18:00:00Z', '2026-10-06T18:00:00Z'])
    expect(points[0]).toMatchObject({ topWeight: 95, e1rm: 110.8 })
    // 90 × 10 (e1RM 120) beats 100 × 5 (116.7), but the top weight is still 100.
    expect(points[1]).toMatchObject({ topWeight: 100, topSet: { weight: 90, reps: 10 }, e1rm: 120 })
  })

  it('skips bodyweight-only sessions', () => {
    expect(exerciseProgress('Push-Up', logs)).toEqual([])
  })
})

describe('loggedExercises', () => {
  it('lists weighted exercises, most recent first', () => {
    expect(loggedExercises(logs)).toEqual(['Bench', 'Row'])
  })
})

describe('weekly volume', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart(new Date(2026, 9, 8))).toBe('2026-10-05') // Thursday → Monday
    expect(weekStart(new Date(2026, 9, 5))).toBe('2026-10-05')
    expect(weekStart(new Date(2026, 9, 11))).toBe('2026-10-05') // Sunday
  })

  it('fills empty weeks and sums completed sessions', () => {
    const weeks = weeklyVolume(logs, 3, new Date(2026, 9, 8, 12))
    expect(weeks.map((w) => w.week)).toEqual(['2026-09-21', '2026-09-28', '2026-10-05'])
    expect(weeks.map((w) => w.volume)).toEqual([0, 1075, 1400])
    expect(weeks.map((w) => w.sessions)).toEqual([0, 1, 1])
  })

  it('totals all completed sessions', () => {
    expect(totalVolume(logs)).toBe(2475)
  })
})

describe('compactKg', () => {
  it.each([[950, '950'], [12400, '12.4k']])('%i → %s', (n, s) => expect(compactKg(n)).toBe(s))
})
