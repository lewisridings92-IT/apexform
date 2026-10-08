import type { WorkoutLog } from '@/db/types'
import { e1rm, logVolume, topSet } from './calc'

const complete = (logs: WorkoutLog[]) =>
  logs.filter((l) => l.status === 'complete').sort((a, b) => a.date.localeCompare(b.date))

export interface ProgressPoint {
  date: string
  topWeight: number // heaviest completed weight that session
  topSet: { weight: number; reps: number } // the set with the best e1RM
  e1rm: number
}

// One point per session that included the exercise, oldest first.
export function exerciseProgress(name: string, logs: WorkoutLog[]): ProgressPoint[] {
  return complete(logs).flatMap((l) => {
    const sets = l.exercises.filter((e) => e.name === name).flatMap((e) => e.sets).filter((s) => s.completed && s.reps > 0)
    const best = topSet(sets)
    if (!best || best.weight <= 0) return []
    return [{
      date: l.date,
      topWeight: Math.max(...sets.map((s) => s.weight)),
      topSet: { weight: best.weight, reps: best.reps },
      e1rm: Math.round(e1rm(best.weight, best.reps) * 10) / 10,
    }]
  })
}

// Weighted exercises the user has logged, most recently done first.
export function loggedExercises(logs: WorkoutLog[]): string[] {
  const latest = new Map<string, string>()
  for (const l of complete(logs)) {
    for (const ex of l.exercises) {
      if (ex.sets.some((s) => s.completed && s.weight > 0)) latest.set(ex.name, l.date)
    }
  }
  return [...latest.entries()].sort((a, b) => b[1].localeCompare(a[1]) || a[0].localeCompare(b[0])).map(([n]) => n)
}

// Monday 00:00 local time of the week containing `date`, as YYYY-MM-DD.
export function weekStart(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface WeekVolume {
  week: string // Monday, YYYY-MM-DD
  volume: number
  sessions: number
}

// Total volume per week for the last `weeks` weeks, including empty weeks, oldest first.
export function weeklyVolume(logs: WorkoutLog[], weeks = 12, now = new Date()): WeekVolume[] {
  const result: WeekVolume[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 7)
    result.push({ week: weekStart(d), volume: 0, sessions: 0 })
  }
  const byWeek = new Map(result.map((w) => [w.week, w]))
  for (const l of complete(logs)) {
    const w = byWeek.get(weekStart(new Date(l.date)))
    if (w) {
      w.volume += logVolume(l)
      w.sessions++
    }
  }
  return result
}

export function totalVolume(logs: WorkoutLog[]): number {
  return complete(logs).reduce((sum, l) => sum + logVolume(l), 0)
}

// "8 Oct", or "8 Oct 2025" outside the current year.
export function shortDate(iso: string, now = new Date()): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

// "12.4k" for big numbers.
export function compactKg(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
}
