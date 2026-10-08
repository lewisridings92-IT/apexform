import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '@/lib/options'
import { db } from './db'
import { getProfile, saveProfile, validateProfile } from './profile'

beforeEach(async () => {
  await db.profile.clear()
})

describe('profile storage', () => {
  it('returns null before onboarding', async () => {
    expect(await getProfile()).toBeNull()
  })

  it('keeps a single profile when saved twice', async () => {
    await saveProfile(DEFAULT_PROFILE)
    await saveProfile({ ...DEFAULT_PROFILE, frequency: 6, onboarding_complete: true })
    expect(await db.profile.count()).toBe(1)
    expect((await getProfile())?.frequency).toBe(6)
  })
})

describe('validateProfile', () => {
  it('accepts the defaults', () => {
    expect(validateProfile(DEFAULT_PROFILE)).toBeNull()
  })
  it('rejects out-of-range days', () => {
    expect(validateProfile({ ...DEFAULT_PROFILE, frequency: 1 })).toMatch(/days per week/)
    expect(validateProfile({ ...DEFAULT_PROFILE, frequency: 8 })).toMatch(/days per week/)
  })
  it('rejects out-of-range session length', () => {
    expect(validateProfile({ ...DEFAULT_PROFILE, session_length: 20 })).toMatch(/Session length/)
  })
  it('needs equipment and a goal', () => {
    expect(validateProfile({ ...DEFAULT_PROFILE, equipment: [] })).toMatch(/equipment/)
    expect(validateProfile({ ...DEFAULT_PROFILE, goals: [] })).toMatch(/goal/)
  })
})
