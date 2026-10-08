import { beforeEach, describe, expect, it } from 'vitest'
import { getAnchors, replaceAnchors, toSelection } from './anchors'
import { db } from './db'

beforeEach(async () => {
  await db.anchors.clear()
})

describe('anchors', () => {
  it('saves the first choice in each group as primary', async () => {
    await replaceAnchors({ Chest: ['Incline DB Press', 'Barbell Bench Press'], Back: ['Lat Pulldown'] })
    const anchors = await getAnchors()
    expect(anchors).toHaveLength(3)
    expect(anchors.find((a) => a.exercise_name === 'Incline DB Press')).toMatchObject({
      muscle_group: 'Chest', equipment: 'Dumbbell', is_primary: true,
    })
    expect(anchors.find((a) => a.exercise_name === 'Barbell Bench Press')?.is_primary).toBe(false)
  })

  it('replaces previous anchors', async () => {
    await replaceAnchors({ Chest: ['Pec Deck'] })
    await replaceAnchors({ Quads: ['Back Squat'] })
    expect((await getAnchors()).map((a) => a.exercise_name)).toEqual(['Back Squat'])
  })

  it('ignores names that are not in the library', async () => {
    await replaceAnchors({ Chest: ['Made Up Press', 'Pec Deck'] })
    const anchors = await getAnchors()
    expect(anchors.map((a) => a.exercise_name)).toEqual(['Pec Deck'])
  })

  it('round-trips through toSelection with the primary first', async () => {
    await replaceAnchors({ Chest: ['Pec Deck', 'Push-Up'] })
    expect(toSelection(await getAnchors())).toEqual({ Chest: ['Pec Deck', 'Push-Up'] })
  })
})
