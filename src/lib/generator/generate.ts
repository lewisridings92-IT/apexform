import type {
  AnchorExercise, MuscleGroup, PlanDay, PlanExercise, UserProfile, WorkoutLog, WorkoutPlan,
} from '@/db/types'
import { type Exercise, exercisesFor, findExercise, isTimed } from '@/lib/exercises'
import { goalLabel } from '@/lib/options'
import { isStalled, suggestNext } from '@/lib/progression'
import {
  COMPOUND_WARM_UP_SETS_MIN, MAIN_LIFTS_PER_DAY, MAX_SETS_PER_MUSCLE_PER_DAY, musclePriority, PRESCRIPTIONS,
  type Prescription, SETUP_MIN, setsPerExercise, splitFor, TIMED_REPS, WARM_UP_MIN, WORK_SEC, weeklySets,
} from './rules'

export interface GenerateInput {
  profile: UserProfile
  anchors: AnchorExercise[]
  // Recent completed sessions. Used for load suggestions and to swap out stalled lifts.
  logs?: WorkoutLog[]
  now?: Date
}

// A plan exercise while it is being built; extra fields are dropped at the end.
interface Draft {
  ex: Exercise
  sets: number
  prescription: Prescription
  firstForMuscle: boolean
}

export function generatePlan({ profile, anchors, logs = [], now = new Date() }: GenerateInput): Omit<WorkoutPlan, 'id'> {
  const goal = profile.goals[0] ?? 'hypertrophy'
  const split = splitFor(profile.frequency)
  const rx = PRESCRIPTIONS[goal]

  // How many days train each muscle, to spread its weekly sets.
  const daysPerMuscle = new Map<MuscleGroup, number>()
  for (const d of split.days) for (const m of d.muscles) daysPerMuscle.set(m, (daysPerMuscle.get(m) ?? 0) + 1)

  // Exercises that have stopped progressing are swapped out, unless they are the main anchor.
  const primaryAnchors = new Set(anchors.filter((a) => a.is_primary).map((a) => a.exercise_name))
  const stalled = new Set(
    unique(logs.flatMap((l) => l.exercises.map((e) => e.name))).filter((n) => isStalled(n, logs)),
  )
  const avoid = new Set([...stalled].filter((n) => !primaryAnchors.has(n)))

  const occurrence = new Map<MuscleGroup, number>()
  let trimmedDays = 0

  const days: PlanDay[] = split.days.map((template) => {
    const used = new Set<string>()
    const drafts: Draft[] = []

    for (const muscle of template.muscles) {
      const k = occurrence.get(muscle) ?? 0
      occurrence.set(muscle, k + 1)

      const daySets = Math.min(
        MAX_SETS_PER_MUSCLE_PER_DAY,
        Math.ceil(weeklySets(muscle, profile.experience_level, goal) / daysPerMuscle.get(muscle)!),
      )
      setsPerExercise(daySets, muscle).forEach((sets, slot) => {
        const ex = pickExercise(muscle, slot, k, profile, anchors, used, avoid)
        if (!ex) return
        used.add(ex.name)
        drafts.push({ ex, sets, prescription: rx.isolation, firstForMuscle: slot === 0 })
      })
    }

    // Compound lifts first, keeping the day's muscle order within each group.
    const ordered = assignPrescriptions(
      [...drafts.filter((d) => d.ex.compound), ...drafts.filter((d) => !d.ex.compound)],
      rx,
    )
    // Re-assign after trimming in case a main lift was dropped.
    const fitted = assignPrescriptions(fitToSession(ordered, profile.session_length), rx)
    if (fitted.length < ordered.length || totalSets(fitted) < totalSets(ordered)) trimmedDays++

    return {
      day_name: template.day_name,
      focus: template.focus,
      exercises: fitted.map((d, i) => toPlanExercise(d, i === 0, rx.note, logs, stalled)),
    }
  })

  return {
    name: `${split.name} · ${goalLabel(goal)}`,
    block_type: goalLabel(goal),
    summary: summarise(profile, split.name, goal, anchors, trimmedDays),
    status: 'active',
    created_at: now.toISOString(),
    days,
  }
}

// The first compound lifts of the day are the heavy main lifts; later compounds are secondary.
function assignPrescriptions(drafts: Draft[], rx: (typeof PRESCRIPTIONS)[keyof typeof PRESCRIPTIONS]): Draft[] {
  let compounds = 0
  return drafts.map((d) => {
    if (!d.ex.compound) return { ...d, prescription: rx.isolation }
    const main = compounds++ < MAIN_LIFTS_PER_DAY
    return { ...d, prescription: main ? rx.compound : rx.secondary }
  })
}

// ── Exercise choice ──────────────────────────────────────────────────────────

function pickExercise(
  muscle: MuscleGroup,
  slot: number,
  occurrence: number,
  profile: UserProfile,
  anchors: AnchorExercise[],
  usedToday: Set<string>,
  avoid: Set<string>,
): Exercise | undefined {
  const available = exercisesFor(muscle, profile.equipment)
  const anchorEx = anchors
    .filter((a) => a.muscle_group === muscle)
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    .map((a) => findExercise(a.exercise_name))
    .filter((e): e is Exercise => !!e && profile.equipment.includes(e.equipment))

  const anchorNames = new Set(anchorEx.map((e) => e.name))
  const all = [...anchorEx, ...available.filter((e) => !anchorNames.has(e.name))]
  const fresh = all.filter((e) => !usedToday.has(e.name))
  const candidates = fresh.filter((e) => !avoid.has(e.name)).length ? fresh.filter((e) => !avoid.has(e.name)) : fresh
  if (!candidates.length) return undefined

  // The main anchor always opens the muscle's work, whatever type it is.
  const primary = candidates.find((e) => e.name === primaryOf(anchors, muscle))
  if (slot === 0 && primary) return primary

  // First slot prefers a compound lift, later slots prefer isolation work.
  const wantCompound = slot === 0
  const preferred = candidates.filter((e) => e.compound === wantCompound)
  const list = preferred.length ? preferred : candidates

  // Anchors come first. Rotate through them (or the top few library picks)
  // so a muscle trained twice a week gets some variety.
  const anchorsInList = list.filter((e) => anchorNames.has(e.name))
  const pool = anchorsInList.length ? anchorsInList : list.slice(0, 3)
  return pool[occurrence % pool.length]
}

function primaryOf(anchors: AnchorExercise[], muscle: MuscleGroup): string | undefined {
  return anchors.find((a) => a.muscle_group === muscle && a.is_primary)?.exercise_name
}

// ── Fitting the session length ───────────────────────────────────────────────

function exerciseMinutes(d: Draft): number {
  const work = d.ex.compound ? WORK_SEC.compound : WORK_SEC.isolation
  // No rest needed after the final set.
  const seconds = d.sets * work + (d.sets - 1) * d.prescription.restSec
  return SETUP_MIN + (d.ex.compound ? COMPOUND_WARM_UP_SETS_MIN : 0) + seconds / 60
}

export function estimateMinutes(drafts: Pick<Draft, 'ex' | 'sets' | 'prescription'>[]): number {
  return WARM_UP_MIN + drafts.reduce((sum, d) => sum + exerciseMinutes(d as Draft), 0)
}

// Lower score = dropped first.
function keepScore(d: Draft): number {
  return musclePriority(d.ex.muscle_group) + (d.ex.compound ? 2 : 0) + (d.firstForMuscle ? 5 : 0)
}

function fitToSession(drafts: Draft[], minutes: number): Draft[] {
  let list = drafts.map((d) => ({ ...d }))
  // Lowest priority first; later exercises before earlier ones on a tie.
  const byLeastImportant = () =>
    list.map((d, i) => ({ d, i })).sort((a, b) => keepScore(a.d) - keepScore(b.d) || b.i - a.i).map((x) => x.d)

  while (estimateMinutes(list) > minutes) {
    // 1. Trim big exercises back to 3 sets.
    const over3 = byLeastImportant().find((d) => d.sets > 3)
    if (over3) { over3.sets--; continue }
    // 2. Drop the least important exercise, keeping at least two.
    if (list.length > 2) {
      const drop = byLeastImportant()[0]
      list = list.filter((d) => d !== drop)
      continue
    }
    // 3. Last resort: two sets each, then a single exercise.
    const over2 = byLeastImportant().find((d) => d.sets > 2)
    if (over2) { over2.sets--; continue }
    if (list.length > 1) { list = list.filter((d) => d !== byLeastImportant()[0]); continue }
    break
  }
  return list
}

function totalSets(drafts: Draft[]): number {
  return drafts.reduce((n, d) => n + d.sets, 0)
}

// ── Output ───────────────────────────────────────────────────────────────────

function toPlanExercise(
  d: Draft,
  isFirst: boolean,
  goalNote: string | undefined,
  logs: WorkoutLog[],
  stalled: Set<string>,
): PlanExercise {
  const reps = isTimed(d.ex.name) ? TIMED_REPS : d.prescription.reps
  const notes: string[] = []
  if (isFirst && d.ex.compound) notes.push('Main lift of the day.')
  if (goalNote && d.ex.compound) notes.push(goalNote)
  const suggestion = suggestNext(d.ex, reps, logs)
  if (suggestion) notes.push(suggestion.note)
  if (stalled.has(d.ex.name)) notes.push('No progress in 3 sessions. Consider a lighter week, then build back up.')

  return {
    name: d.ex.name,
    muscle_group: d.ex.muscle_group,
    sets: d.sets,
    reps,
    rir: d.prescription.rir,
    rest: d.prescription.rest,
    ...(notes.length ? { notes: notes.join(' ') } : {}),
  }
}

function summarise(
  profile: UserProfile,
  splitName: string,
  goal: UserProfile['goals'][number],
  anchors: AnchorExercise[],
  trimmedDays: number,
): string {
  const rx = PRESCRIPTIONS[goal].compound
  const parts = [
    `${profile.frequency} days a week, ${splitName.toLowerCase()} split, built for ${goalLabel(goal).toLowerCase()}.`,
    `Main lifts use ${rx.reps} reps at ${rx.rir} reps in reserve with ${rx.rest} rest.`,
  ]
  const primaries = anchors.filter((a) => a.is_primary).map((a) => a.exercise_name)
  if (primaries.length) parts.push(`Built around your anchors: ${primaries.join(', ')}.`)
  if (trimmedDays) parts.push(`Volume was trimmed to fit ${profile.session_length}-minute sessions.`)
  return parts.join(' ')
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

// Estimated length of a saved plan day, for display.
export function estimateDayMinutes(day: PlanDay): number {
  const drafts = day.exercises.flatMap((pe) => {
    const ex = findExercise(pe.name)
    if (!ex) return []
    const prescription = { reps: pe.reps, rir: pe.rir, rest: pe.rest, restSec: parseRestSec(pe.rest) }
    return [{ ex, sets: pe.sets, prescription }]
  })
  return Math.round(estimateMinutes(drafts))
}

// "2-3 min" → 150, "60-90 s" → 75, "90 s" → 90.
export function parseRestSec(rest: string): number {
  const nums = rest.match(/\d+/g)?.map(Number) ?? []
  if (!nums.length) return 90
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length
  return /min/.test(rest) ? avg * 60 : avg
}
