import type { LoggedSet, WorkoutLog } from '@/db/types'

// Estimated one-rep max (Epley): weight × (1 + reps / 30).
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

// Sum of weight × reps over completed sets.
export function setsVolume(sets: LoggedSet[]): number {
  return sets.reduce((sum, s) => (s.completed ? sum + s.weight * s.reps : sum), 0)
}

export function logVolume(log: WorkoutLog): number {
  return log.exercises.reduce((sum, ex) => sum + setsVolume(ex.sets), 0)
}

// The completed set with the highest estimated 1RM.
export function topSet(sets: LoggedSet[]): LoggedSet | undefined {
  let best: LoggedSet | undefined
  for (const s of sets) {
    if (s.completed && (!best || e1rm(s.weight, s.reps) > e1rm(best.weight, best.reps))) best = s
  }
  return best
}
