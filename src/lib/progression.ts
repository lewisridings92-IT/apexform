import type { Equipment, LoggedSet, MuscleGroup, WorkoutLog } from '@/db/types'
import { e1rm, topSet } from './calc'

export interface RepRange {
  min: number
  max: number
}

// "6-10" → { min: 6, max: 10 }, "8" → { min: 8, max: 8 }. Timed ranges return null.
export function parseRepRange(reps: string): RepRange | null {
  if (/\bs\b|sec|min/.test(reps)) return null
  const nums = reps.match(/\d+/g)?.map(Number)
  if (!nums?.length) return null
  return { min: nums[0], max: nums[nums.length - 1] }
}

export interface Performance {
  date: string
  sets: LoggedSet[] // completed sets only
}

// Completed sets for one exercise, newest session first.
export function history(name: string, logs: WorkoutLog[]): Performance[] {
  return [...logs]
    .filter((l) => l.status === 'complete')
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((l) => {
      const ex = l.exercises.find((e) => e.name === name)
      const sets = ex?.sets.filter((s) => s.completed && s.reps > 0) ?? []
      return sets.length ? [{ date: l.date, sets }] : []
    })
}

const LOWER_BODY: MuscleGroup[] = ['Quads', 'Hamstrings', 'Glutes']

// Smallest sensible jump in load, in kg.
export function weightIncrement(equipment: Equipment, muscle: MuscleGroup, compound: boolean): number {
  switch (equipment) {
    case 'Barbell':
      return compound && LOWER_BODY.includes(muscle) ? 5 : 2.5
    case 'Dumbbell':
      return 2
    case 'Kettlebell':
      return 4
    case 'EZ Bar':
    case 'Machine':
    case 'Cable':
      return compound && LOWER_BODY.includes(muscle) ? 5 : 2.5
    default:
      return 0 // Bodyweight, Bands: progress with reps or a harder variation
  }
}

export interface Suggestion {
  weight: number | null // suggested working weight, if load-based
  note: string
}

const kg = (n: number) => `${Number(n.toFixed(2))} kg`

// What to do next time, based on the most recent session with this exercise.
export function suggestNext(
  exercise: { name: string; equipment: Equipment; muscle_group: MuscleGroup; compound: boolean },
  targetReps: string,
  logs: WorkoutLog[],
): Suggestion | null {
  const last = history(exercise.name, logs)[0]
  if (!last) return null
  const top = topSet(last.sets)!
  const range = parseRepRange(targetReps)
  const lastText = top.weight > 0 ? `${kg(top.weight)} × ${top.reps}` : `${top.reps} reps`
  const increment = weightIncrement(exercise.equipment, exercise.muscle_group, exercise.compound)

  if (!range) return { weight: top.weight || null, note: `Last time: ${lastText}.` }

  const working = last.sets.filter((s) => s.weight === top.weight)
  const hitTop = working.every((s) => s.reps >= range.max)

  if (hitTop) {
    if (top.weight > 0 && increment > 0) {
      const next = top.weight + increment
      return { weight: next, note: `Last time: ${lastText}, top of the range. Try ${kg(next)}.` }
    }
    return { weight: top.weight || null, note: `Last time: ${lastText}, top of the range. Add load or use a harder variation.` }
  }
  if (top.reps < range.min) {
    return { weight: top.weight || null, note: `Last time: ${lastText}. Stay here until you reach ${range.min} reps.` }
  }
  return { weight: top.weight || null, note: `Last time: ${lastText}. Aim for more reps at the same weight.` }
}

// True when the best set hasn't improved over the last 3 sessions with this exercise.
export function isStalled(name: string, logs: WorkoutLog[]): boolean {
  const recent = history(name, logs).slice(0, 3)
  if (recent.length < 3) return false
  const best = recent.map((p) => {
    const t = topSet(p.sets)!
    return t.weight > 0 ? e1rm(t.weight, t.reps) : t.reps
  })
  // best[0] is the newest session
  return best[0] <= best[2]
}
