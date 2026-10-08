// Development only: fills the history with believable sessions so charts can be checked.
// Settings shows these buttons only when running `npm run dev`.
import { findExercise, isTimed } from '@/lib/exercises'
import { parseRepRange } from '@/lib/progression'
import { db } from './db'
import { getActivePlan } from './plans'
import type { WorkoutLog } from './types'

const DEMO_TAG = 'demo'

// Starting weights by equipment, then a small weekly gain.
const START: Record<string, number> = {
  Barbell: 60, Dumbbell: 20, Machine: 50, Cable: 30, Kettlebell: 16, 'EZ Bar': 25, Bodyweight: 0, Bands: 0,
}

export async function addDemoHistory(weeks = 8, now = new Date()): Promise<number> {
  const plan = await getActivePlan()
  if (!plan) throw new Error('Generate a plan first')

  const logs: WorkoutLog[] = []
  for (let w = weeks; w >= 1; w--) {
    plan.days.forEach((day, d) => {
      const date = new Date(now)
      date.setDate(date.getDate() - w * 7 + d * Math.floor(7 / plan.days.length))
      date.setHours(18, 0, 0, 0)
      const week = weeks - w // 0 = oldest
      logs.push({
        date: date.toISOString(),
        day_name: day.day_name,
        duration_min: 55 + ((w * 7 + d * 3) % 20),
        status: 'complete',
        exercises: day.exercises.map((pe) => {
          const lib = findExercise(pe.name)
          const base = (START[lib?.equipment ?? 'Machine'] ?? 40) * (lib?.compound ? 1.5 : 1)
          const step = lib?.compound ? 2.5 : 1
          // Mostly upward with a stall in week 5.
          const weight = base ? Math.round((base + step * Math.min(week, 4) + step * Math.max(0, week - 5)) * 2) / 2 : 0
          const range = parseRepRange(pe.reps)
          const reps = isTimed(pe.name) ? 40 : range ? range.min + ((week + d) % (range.max - range.min + 1)) : 10
          return {
            name: pe.name, muscle_group: pe.muscle_group, target_sets: pe.sets, target_reps: pe.reps,
            target_rir: pe.rir, target_rest: pe.rest,
            sets: Array.from({ length: pe.sets }, (_, i) => ({ weight, reps: Math.max(1, reps - i), completed: true })),
          }
        }),
      })
    })
  }
  await db.logs.bulkAdd(logs)
  await db.settings.put({ key: DEMO_TAG, value: logs.map((l) => l.date) })
  return logs.length
}

export async function removeDemoHistory(): Promise<void> {
  const dates = ((await db.settings.get(DEMO_TAG))?.value as string[] | undefined) ?? []
  await db.logs.where('date').anyOf(dates).delete()
  await db.settings.delete(DEMO_TAG)
}
