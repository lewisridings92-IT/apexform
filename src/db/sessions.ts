import { e1rm, logVolume } from '@/lib/calc'
import { findExercise, isTimed } from '@/lib/exercises'
import { history, parseRepRange, suggestNext } from '@/lib/progression'
import { db } from './db'
import type { LoggedExercise, LoggedSet, PlanDay, WorkoutLog } from './types'

// ── Building a session ───────────────────────────────────────────────────────

export interface ExerciseHint {
  note: string | null // e.g. "Last time: 100 kg × 8. Aim for more reps at the same weight."
  repsPlaceholder: number[] // per set: last session's reps, else the bottom of the range
}

// A new in-progress log for a plan day, with weights prefilled from history.
export function buildSessionLog(day: PlanDay, logs: WorkoutLog[], now = new Date()): Omit<WorkoutLog, 'id'> {
  return {
    date: now.toISOString(),
    day_name: day.day_name,
    duration_min: 0,
    status: 'in_progress',
    exercises: day.exercises.map((pe): LoggedExercise => {
      const lib = findExercise(pe.name)
      const suggestion = lib ? suggestNext(lib, pe.reps, logs) : null
      const last = history(pe.name, logs)[0]
      const weight = suggestion?.weight ?? last?.sets[0]?.weight ?? 0
      return {
        name: pe.name,
        muscle_group: pe.muscle_group,
        target_sets: pe.sets,
        target_reps: pe.reps,
        target_rir: pe.rir,
        target_rest: pe.rest,
        sets: Array.from({ length: pe.sets }, () => ({ weight, reps: 0, completed: false })),
      }
    }),
  }
}

export function exerciseHint(ex: LoggedExercise, logs: WorkoutLog[]): ExerciseHint {
  const lib = findExercise(ex.name)
  const suggestion = lib ? suggestNext(lib, ex.target_reps, logs) : null
  const last = history(ex.name, logs)[0]
  const fallback = parseRepRange(ex.target_reps)?.min ?? (isTimed(ex.name) ? 30 : 8)
  return {
    note: suggestion?.note ?? null,
    repsPlaceholder: ex.sets.map((_, i) => last?.sets[i]?.reps ?? last?.sets.at(-1)?.reps ?? fallback),
  }
}

// ── Saving ───────────────────────────────────────────────────────────────────

export async function getInProgress(): Promise<WorkoutLog | null> {
  return (await db.logs.where('status').equals('in_progress').first()) ?? null
}

// Returns the unfinished session if there is one, otherwise starts a new one.
// Runs in a transaction so a double call can never create two sessions.
export async function startSession(day: PlanDay, logs: WorkoutLog[]): Promise<WorkoutLog> {
  return db.transaction('rw', db.logs, async () => {
    const existing = await getInProgress()
    if (existing) return existing
    const log = buildSessionLog(day, logs)
    const id = await db.logs.add(log)
    return { ...log, id }
  })
}

export async function saveSession(log: WorkoutLog): Promise<void> {
  await db.logs.put(log)
}

export async function finishSession(log: WorkoutLog, now = new Date()): Promise<WorkoutLog> {
  const done: WorkoutLog = {
    ...log,
    status: 'complete',
    duration_min: Math.max(1, Math.round((now.getTime() - new Date(log.date).getTime()) / 60000)),
  }
  await db.logs.put(done)
  return done
}

export async function discardSession(id: number): Promise<void> {
  await db.logs.delete(id)
}

// ── Editing helpers (pure) ───────────────────────────────────────────────────

export function updateSet(log: WorkoutLog, exIndex: number, setIndex: number, patch: Partial<LoggedSet>): WorkoutLog {
  return {
    ...log,
    exercises: log.exercises.map((ex, i) =>
      i !== exIndex ? ex : { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) },
    ),
  }
}

export function addSet(log: WorkoutLog, exIndex: number): WorkoutLog {
  return {
    ...log,
    exercises: log.exercises.map((ex, i) => {
      if (i !== exIndex) return ex
      const prev = ex.sets.at(-1)
      return { ...ex, sets: [...ex.sets, { weight: prev?.weight ?? 0, reps: 0, completed: false }] }
    }),
  }
}

export function removeLastSet(log: WorkoutLog, exIndex: number): WorkoutLog {
  return {
    ...log,
    exercises: log.exercises.map((ex, i) => (i === exIndex && ex.sets.length > 1 ? { ...ex, sets: ex.sets.slice(0, -1) } : ex)),
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────

export interface SessionStats {
  completedSets: number
  totalSets: number
  volume: number
}

export function sessionStats(log: WorkoutLog): SessionStats {
  const sets = log.exercises.flatMap((e) => e.sets)
  return { completedSets: sets.filter((s) => s.completed).length, totalSets: sets.length, volume: logVolume(log) }
}

export interface PersonalRecord {
  name: string
  set: LoggedSet
  previousBest: number // e1RM in kg, or reps for bodyweight work
}

const score = (s: LoggedSet) => (s.weight > 0 ? e1rm(s.weight, s.reps) : s.reps)

// Exercises where this session beat every earlier session. First-time exercises don't count.
export function personalRecords(log: WorkoutLog, previous: WorkoutLog[]): PersonalRecord[] {
  const earlier = previous.filter((l) => l.id !== log.id && l.status === 'complete' && l.date < log.date)
  return log.exercises.flatMap((ex) => {
    const best = ex.sets.filter((s) => s.completed && s.reps > 0).sort((a, b) => score(b) - score(a))[0]
    if (!best) return []
    const past = history(ex.name, earlier).flatMap((p) => p.sets)
    if (!past.length) return []
    const previousBest = Math.max(...past.map(score))
    return score(best) > previousBest ? [{ name: ex.name, set: best, previousBest }] : []
  })
}
