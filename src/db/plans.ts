import { generatePlan } from '@/lib/generator/generate'
import { getAnchors } from './anchors'
import { db } from './db'
import { getProfile } from './profile'
import type { WorkoutLog, WorkoutPlan } from './types'

// The number of recent sessions used when regenerating (as in the Base44 app).
export const RECENT_LOGS = 6

export async function getActivePlan(): Promise<WorkoutPlan | null> {
  return (await db.plans.where('status').equals('active').last()) ?? null
}

// Saves a new active plan; older plans are kept as archived.
export async function saveNewPlan(plan: Omit<WorkoutPlan, 'id'>): Promise<number> {
  return db.transaction('rw', db.plans, async () => {
    await db.plans.where('status').equals('active').modify({ status: 'archived' })
    return (await db.plans.add({ ...plan, status: 'active' }))!
  })
}

export async function recentLogs(limit = RECENT_LOGS): Promise<WorkoutLog[]> {
  return db.logs.orderBy('date').reverse().filter((l) => l.status === 'complete').limit(limit).toArray()
}

// Builds a plan from the saved profile, anchors and recent sessions.
export async function generateAndSavePlan(): Promise<WorkoutPlan> {
  const profile = await getProfile()
  if (!profile?.onboarding_complete) throw new Error('Finish onboarding first')
  const plan = generatePlan({ profile, anchors: await getAnchors(), logs: await recentLogs() })
  const id = await saveNewPlan(plan)
  return { ...plan, id }
}
