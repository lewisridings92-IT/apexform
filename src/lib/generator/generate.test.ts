import { describe, expect, it } from 'vitest'
import type { AnchorExercise, Equipment, UserProfile, WorkoutLog } from '@/db/types'
import { findExercise } from '@/lib/exercises'
import { DEFAULT_PROFILE, EQUIPMENT } from '@/lib/options'
import { estimateDayMinutes, generatePlan, parseRestSec } from './generate'

const NOW = new Date('2026-10-08T12:00:00Z')

const profile = (patch: Partial<UserProfile> = {}): UserProfile => ({
  ...DEFAULT_PROFILE, onboarding_complete: true, ...patch,
})

const anchor = (exercise_name: string, is_primary = true): AnchorExercise => {
  const ex = findExercise(exercise_name)!
  return { exercise_name, muscle_group: ex.muscle_group, equipment: ex.equipment, is_primary }
}

const SAMPLES: [string, UserProfile][] = [
  ['2 days / 30 min', profile({ frequency: 2, session_length: 30 })],
  ['3 days / 60 min strength', profile({ frequency: 3, session_length: 60, goals: ['maximal_strength'] })],
  ['4 days / 75 min (defaults)', profile()],
  ['5 days / 90 min elite', profile({ frequency: 5, session_length: 90, experience_level: 'elite' })],
  ['6 days / 120 min', profile({ frequency: 6, session_length: 120 })],
  ['7 days / 45 min power', profile({ frequency: 7, session_length: 45, goals: ['power'] })],
  ['bodyweight only', profile({ equipment: ['Bodyweight'] })],
  ['bands only, 3 days', profile({ frequency: 3, equipment: ['Bands'] })],
  ['full gym, general fitness', profile({ equipment: EQUIPMENT, goals: ['general_fitness'] })],
]

describe.each(SAMPLES)('%s', (_, p) => {
  const plan = generatePlan({ profile: p, anchors: [], now: NOW })

  it('has one day per training day', () => {
    expect(plan.days).toHaveLength(p.frequency)
  })

  it('fits every day in the session length', () => {
    for (const day of plan.days) {
      expect(estimateDayMinutes(day), day.day_name).toBeLessThanOrEqual(p.session_length)
    }
  })

  it('uses only library exercises the user has equipment for', () => {
    for (const day of plan.days) {
      for (const ex of day.exercises) {
        const lib = findExercise(ex.name)
        expect(lib, ex.name).toBeDefined()
        expect(p.equipment as Equipment[]).toContain(lib!.equipment)
      }
    }
  })

  it('never repeats an exercise within a day', () => {
    for (const day of plan.days) {
      const names = day.exercises.map((e) => e.name)
      expect(new Set(names).size, day.day_name).toBe(names.length)
    }
  })

  it('gives every day at least one exercise with 2–5 sets each', () => {
    for (const day of plan.days) {
      expect(day.exercises.length, day.day_name).toBeGreaterThan(0)
      for (const ex of day.exercises) {
        expect(ex.sets).toBeGreaterThanOrEqual(2)
        expect(ex.sets).toBeLessThanOrEqual(5)
      }
    }
  })

  it('puts compound lifts before isolation lifts', () => {
    for (const day of plan.days) {
      const compound = day.exercises.map((e) => findExercise(e.name)!.compound)
      expect(compound, day.day_name).toEqual([...compound].sort((a, b) => Number(b) - Number(a)))
    }
  })
})

describe('splits', () => {
  it.each([
    [2, 'Full Body A'], [3, 'Full Body C'], [4, 'Upper A'], [5, 'Push'], [6, 'Legs B'], [7, 'Weak Points'],
  ])('%i days includes %s', (frequency, dayName) => {
    const plan = generatePlan({ profile: profile({ frequency, session_length: 120 }), anchors: [], now: NOW })
    expect(plan.days.map((d) => d.day_name)).toContain(dayName)
  })
})

describe('volume', () => {
  it('gives an advanced lifter about 15 weekly chest sets with plenty of time', () => {
    const plan = generatePlan({ profile: profile({ frequency: 6, session_length: 120 }), anchors: [], now: NOW })
    const chestSets = plan.days.flatMap((d) => d.exercises).filter((e) => e.muscle_group === 'Chest')
      .reduce((n, e) => n + e.sets, 0)
    expect(chestSets).toBeGreaterThanOrEqual(12)
    expect(chestSets).toBeLessThanOrEqual(18)
  })

  it('gives strength blocks fewer sets than hypertrophy blocks', () => {
    const total = (goal: UserProfile['goals'][number]) =>
      generatePlan({ profile: profile({ session_length: 120, goals: [goal] }), anchors: [], now: NOW })
        .days.flatMap((d) => d.exercises).reduce((n, e) => n + e.sets, 0)
    expect(total('maximal_strength')).toBeLessThan(total('hypertrophy'))
  })

  it('says when sessions were trimmed to fit', () => {
    const plan = generatePlan({ profile: profile({ frequency: 2, session_length: 30 }), anchors: [], now: NOW })
    expect(plan.summary).toMatch(/trimmed to fit 30-minute/)
  })
})

describe('prescriptions', () => {
  it('uses low reps for strength compounds and higher reps for hypertrophy isolation', () => {
    const strength = generatePlan({ profile: profile({ goals: ['maximal_strength'] }), anchors: [], now: NOW })
    const hyp = generatePlan({ profile: profile({ session_length: 120 }), anchors: [], now: NOW })
    expect(strength.days[0].exercises[0].reps).toBe('3-5')
    const iso = hyp.days.flatMap((d) => d.exercises).find((e) => !findExercise(e.name)!.compound)!
    expect(iso.reps).toBe('10-15')
  })

  it('prescribes holds in seconds', () => {
    const plan = generatePlan({
      profile: profile({ frequency: 4, session_length: 120, equipment: ['Bodyweight'] }),
      anchors: [anchor('Plank')], now: NOW,
    })
    const plank = plan.days.flatMap((d) => d.exercises).find((e) => e.name === 'Plank')
    expect(plank?.reps).toBe('30-45 s')
  })
})

describe('anchors', () => {
  const anchors = [anchor('Incline DB Press'), anchor('Machine Chest Press', false), anchor('Hack Squat'), anchor('Pec Deck', false)]
  const plan = generatePlan({ profile: profile(), anchors, now: NOW })

  it('opens every chest workout with the main anchor', () => {
    for (const day of plan.days.filter((d) => d.exercises.some((e) => e.muscle_group === 'Chest'))) {
      expect(day.exercises.find((e) => e.muscle_group === 'Chest')?.name).toBe('Incline DB Press')
    }
  })

  it('uses secondary anchors before library exercises', () => {
    const names = plan.days.flatMap((d) => d.exercises.map((e) => e.name))
    expect(names).toContain('Pec Deck')
    expect(names).toContain('Hack Squat')
  })

  it('uses an isolation lift as the main anchor if that is what was starred', () => {
    const p = generatePlan({ profile: profile(), anchors: [anchor('Pec Deck')], now: NOW })
    expect(p.days[0].exercises.map((e) => e.name)).toContain('Pec Deck')
  })

  it('ignores anchors that need equipment the user no longer has', () => {
    const p = generatePlan({ profile: profile({ equipment: ['Bodyweight'] }), anchors, now: NOW })
    expect(p.days.flatMap((d) => d.exercises.map((e) => e.name))).not.toContain('Incline DB Press')
  })

  it('names the anchors in the summary', () => {
    expect(plan.summary).toMatch(/Incline DB Press, Hack Squat/)
  })
})

describe('determinism', () => {
  it('gives the same plan for the same input', () => {
    const input = { profile: profile({ frequency: 5 }), anchors: [anchor('Back Squat')], now: NOW }
    expect(generatePlan(input)).toEqual(generatePlan(input))
  })
})

describe('regenerating from logs', () => {
  const log = (date: string, weight: number, reps: number): WorkoutLog => ({
    date, day_name: 'Upper A', duration_min: 60, status: 'complete',
    exercises: [{
      name: 'Incline DB Press', muscle_group: 'Chest', target_sets: 3, target_reps: '6-10', target_rir: '1-2',
      sets: [1, 2, 3].map(() => ({ weight, reps, completed: true })),
    }, {
      name: 'Lat Pulldown', muscle_group: 'Back', target_sets: 3, target_reps: '6-10', target_rir: '1-2',
      sets: [{ weight: 60, reps: 8, completed: true }],
    }],
  })

  it('suggests more load when the top of the range was hit', () => {
    const plan = generatePlan({ profile: profile(), anchors: [anchor('Incline DB Press')], logs: [log('2026-10-06', 30, 10)], now: NOW })
    const incline = plan.days[0].exercises.find((e) => e.name === 'Incline DB Press')!
    expect(incline.notes).toMatch(/Try 32 kg/)
  })

  it('swaps out a stalled non-anchor exercise', () => {
    const logs = ['2026-09-29', '2026-10-01', '2026-10-06'].map((d) => log(d, 30, 8))
    const plan = generatePlan({ profile: profile(), anchors: [anchor('Incline DB Press')], logs, now: NOW })
    const names = plan.days.flatMap((d) => d.exercises.map((e) => e.name))
    expect(names).not.toContain('Lat Pulldown')
    // The main anchor stays, with a note.
    const incline = plan.days[0].exercises.find((e) => e.name === 'Incline DB Press')!
    expect(incline.notes).toMatch(/No progress in 3 sessions/)
  })
})

describe('parseRestSec', () => {
  it.each([['2-3 min', 150], ['60-90 s', 75], ['90 s', 90], ['3-4 min', 210]])('%s → %i', (rest, sec) => {
    expect(parseRestSec(rest)).toBe(sec)
  })
})
