import Dexie, { type EntityTable } from 'dexie'
import type { AnchorExercise, Setting, UserProfile, WorkoutLog, WorkoutPlan } from './types'

// All data lives in IndexedDB on the device. Nothing is sent anywhere.
export const db = new Dexie('apexform') as Dexie & {
  profile: EntityTable<UserProfile, 'id'>
  anchors: EntityTable<AnchorExercise, 'id'>
  plans: EntityTable<WorkoutPlan, 'id'>
  logs: EntityTable<WorkoutLog, 'id'>
  settings: EntityTable<Setting, 'key'>
}

// Only indexed fields are listed; other fields are stored as-is.
// Schema changes need a new db.version(n) with an upgrade, never an edit here.
db.version(1).stores({
  profile: '++id',
  anchors: '++id, muscle_group',
  plans: '++id, status, created_at',
  logs: '++id, date, status',
  settings: 'key',
})

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await db.settings.get(key))?.value as T | undefined
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value })
}
