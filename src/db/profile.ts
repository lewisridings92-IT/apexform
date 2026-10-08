import { FREQUENCY, SESSION_LENGTH } from '@/lib/options'
import { db } from './db'
import type { UserProfile } from './types'

// There is only ever one profile; it always uses this id.
const PROFILE_ID = 1

export async function getProfile(): Promise<UserProfile | null> {
  return (await db.profile.get(PROFILE_ID)) ?? null
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await db.profile.put({ ...profile, id: PROFILE_ID })
}

// Returns a message for the first problem found, or null if the profile is valid.
export function validateProfile(p: UserProfile): string | null {
  if (!Number.isInteger(p.frequency) || p.frequency < FREQUENCY.min || p.frequency > FREQUENCY.max)
    return `Choose between ${FREQUENCY.min} and ${FREQUENCY.max} days per week`
  if (p.session_length < SESSION_LENGTH.min || p.session_length > SESSION_LENGTH.max)
    return `Session length must be ${SESSION_LENGTH.min}–${SESSION_LENGTH.max} minutes`
  if (p.equipment.length === 0) return 'Choose at least one type of equipment'
  if (p.goals.length === 0) return 'Choose at least one goal'
  return null
}
