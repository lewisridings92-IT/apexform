import type { ExperienceLevel, Goal, MuscleGroup } from '@/db/types'

// ── Splits ───────────────────────────────────────────────────────────────────

export interface DayTemplate {
  day_name: string
  focus: string
  // Muscles trained this day, most important first.
  muscles: MuscleGroup[]
}

export interface Split {
  name: string
  days: DayTemplate[]
}

const FULL_A: MuscleGroup[] = ['Quads', 'Chest', 'Back', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Calves', 'Abs']
const FULL_B: MuscleGroup[] = ['Hamstrings', 'Back', 'Chest', 'Quads', 'Glutes', 'Shoulders', 'Triceps', 'Biceps', 'Abs']
const FULL_C: MuscleGroup[] = ['Glutes', 'Chest', 'Back', 'Quads', 'Shoulders', 'Biceps', 'Triceps', 'Calves', 'Forearms']
const UPPER: MuscleGroup[] = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms']
const LOWER: MuscleGroup[] = ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs']
const PUSH: MuscleGroup[] = ['Chest', 'Shoulders', 'Triceps']
const PULL: MuscleGroup[] = ['Back', 'Biceps', 'Forearms']
const LEGS: MuscleGroup[] = ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs']
const WEAK_POINTS: MuscleGroup[] = ['Shoulders', 'Biceps', 'Triceps', 'Calves', 'Abs']

const day = (day_name: string, focus: string, muscles: MuscleGroup[]): DayTemplate => ({ day_name, focus, muscles })

export function splitFor(frequency: number): Split {
  switch (frequency) {
    case 2:
      return { name: 'Full body', days: [day('Full Body A', 'Full body', FULL_A), day('Full Body B', 'Full body', FULL_B)] }
    case 3:
      return {
        name: 'Full body',
        days: [day('Full Body A', 'Full body', FULL_A), day('Full Body B', 'Full body', FULL_B), day('Full Body C', 'Full body', FULL_C)],
      }
    case 4:
      return {
        name: 'Upper/lower',
        days: [day('Upper A', 'Upper body', UPPER), day('Lower A', 'Lower body', LOWER), day('Upper B', 'Upper body', UPPER), day('Lower B', 'Lower body', LOWER)],
      }
    case 5:
      return {
        name: 'Push/pull/legs + upper/lower',
        days: [day('Push', 'Chest, shoulders, triceps', PUSH), day('Pull', 'Back and biceps', PULL), day('Legs', 'Legs', LEGS), day('Upper', 'Upper body', UPPER), day('Lower', 'Lower body', LOWER)],
      }
    case 6:
      return {
        name: 'Push/pull/legs',
        days: [
          day('Push A', 'Chest, shoulders, triceps', PUSH), day('Pull A', 'Back and biceps', PULL), day('Legs A', 'Legs', LEGS),
          day('Push B', 'Chest, shoulders, triceps', PUSH), day('Pull B', 'Back and biceps', PULL), day('Legs B', 'Legs', LEGS),
        ],
      }
    case 7:
      return {
        name: 'Push/pull/legs + weak points',
        days: [
          day('Push A', 'Chest, shoulders, triceps', PUSH), day('Pull A', 'Back and biceps', PULL), day('Legs A', 'Legs', LEGS),
          day('Push B', 'Chest, shoulders, triceps', PUSH), day('Pull B', 'Back and biceps', PULL), day('Legs B', 'Legs', LEGS),
          day('Weak Points', 'Shoulders, arms, calves, abs', WEAK_POINTS),
        ],
      }
    default:
      throw new Error(`No split for ${frequency} days per week`)
  }
}

// ── Weekly volume ────────────────────────────────────────────────────────────

const BIG: MuscleGroup[] = ['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes']

// Weekly hard sets for a hypertrophy block, by experience.
const WEEKLY_SETS: Record<ExperienceLevel, { big: number; small: number; forearms: number }> = {
  intermediate: { big: 12, small: 8, forearms: 4 },
  advanced: { big: 15, small: 10, forearms: 6 },
  elite: { big: 18, small: 12, forearms: 6 },
}

// Heavier goals need fewer sets because each one is more fatiguing.
const VOLUME_FACTOR: Record<Goal, number> = {
  hypertrophy: 1,
  body_recomp: 0.9,
  maximal_strength: 0.8,
  power: 0.7,
  general_fitness: 0.75,
}

export function weeklySets(muscle: MuscleGroup, experience: ExperienceLevel, goal: Goal): number {
  const base = WEEKLY_SETS[experience]
  const sets = muscle === 'Forearms' ? base.forearms : BIG.includes(muscle) ? base.big : base.small
  return Math.round(sets * VOLUME_FACTOR[goal])
}

export const MAX_SETS_PER_MUSCLE_PER_DAY = 10

// Splits a day's sets for one muscle into exercises of 2–5 sets each.
// Small muscles get one exercise until they need more than 5 sets.
export function setsPerExercise(sets: number, muscle: MuscleGroup): number[] {
  if (sets <= 0) return []
  const small = !BIG.includes(muscle)
  const count = sets <= (small ? 5 : 4) ? 1 : sets <= 8 ? 2 : 3
  const each = Math.max(2, Math.floor(sets / count))
  const result = Array<number>(count).fill(each)
  for (let i = 0, left = sets - each * count; left > 0; i++, left--) result[i % count]++
  return result.map((n) => Math.min(n, 5))
}

// How important a muscle is to keep when a session must be shortened.
export function musclePriority(muscle: MuscleGroup): number {
  if (BIG.includes(muscle)) return 10
  if (muscle === 'Biceps' || muscle === 'Triceps') return 5
  if (muscle === 'Forearms') return 1
  return 3 // Calves, Abs
}

// ── Prescriptions ────────────────────────────────────────────────────────────

export interface Prescription {
  reps: string
  rir: string
  rest: string
  restSec: number
}

const P = (reps: string, rir: string, rest: string, restSec: number): Prescription => ({ reps, rir, rest, restSec })

// `compound` is for the day's main lifts (the first MAIN_LIFTS_PER_DAY compounds);
// later compound lifts use `secondary`.
export const PRESCRIPTIONS: Record<
  Goal,
  { compound: Prescription; secondary: Prescription; isolation: Prescription; note?: string }
> = {
  maximal_strength: {
    compound: P('3-5', '1-2', '3-4 min', 210),
    secondary: P('6-8', '1-2', '2 min', 120),
    isolation: P('8-10', '1-2', '90 s', 90),
  },
  power: {
    compound: P('3-5', '2-3', '3 min', 180),
    secondary: P('5-8', '2', '2 min', 120),
    isolation: P('8-12', '2', '90 s', 90),
    note: 'Move the weight as fast as you can with good form.',
  },
  hypertrophy: {
    compound: P('6-10', '1-2', '2-3 min', 150),
    secondary: P('8-12', '1-2', '2 min', 120),
    isolation: P('10-15', '0-1', '60-90 s', 75),
  },
  body_recomp: {
    compound: P('6-8', '1-2', '2 min', 120),
    secondary: P('8-12', '1-2', '90 s', 90),
    isolation: P('10-15', '1-2', '60 s', 60),
  },
  general_fitness: {
    compound: P('8-12', '2-3', '90 s', 90),
    secondary: P('10-12', '2-3', '90 s', 90),
    isolation: P('12-15', '2-3', '60 s', 60),
  },
}

export const MAIN_LIFTS_PER_DAY = 2

// Holds and carries are prescribed in seconds instead of reps.
export const TIMED_REPS = '30-45 s'

// ── Session timing ───────────────────────────────────────────────────────────

export const WARM_UP_MIN = 5
export const SETUP_MIN = 1 // per exercise
export const COMPOUND_WARM_UP_SETS_MIN = 2 // ramp-up sets before each compound lift
export const WORK_SEC = { compound: 45, isolation: 35 }
