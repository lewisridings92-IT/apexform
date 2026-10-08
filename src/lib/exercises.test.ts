import { describe, expect, it } from 'vitest'
import { EQUIPMENT, MUSCLE_GROUPS } from './options'
import { EXERCISES, exercisesFor, findExercise } from './exercises'

describe('exercise library', () => {
  it('has about 100 exercises', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(100)
  })

  it('has unique names', () => {
    expect(new Set(EXERCISES.map((e) => e.name)).size).toBe(EXERCISES.length)
  })

  it('only uses known equipment and muscle groups', () => {
    for (const e of EXERCISES) {
      expect(EQUIPMENT).toContain(e.equipment)
      expect(MUSCLE_GROUPS).toContain(e.muscle_group)
    }
  })

  it('covers every muscle group with bodyweight alone', () => {
    for (const m of MUSCLE_GROUPS) {
      expect(exercisesFor(m, ['Bodyweight']).length, m).toBeGreaterThan(0)
    }
  })

  it('has a compound lift for each big muscle group with a full gym', () => {
    for (const m of ['Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes'] as const) {
      expect(exercisesFor(m, EQUIPMENT).some((e) => e.compound), m).toBe(true)
    }
  })
})

describe('exercisesFor', () => {
  it('filters by equipment', () => {
    const names = exercisesFor('Chest', ['Machine']).map((e) => e.name)
    expect(names).toContain('Pec Deck')
    expect(names).not.toContain('Barbell Bench Press')
  })

  it('finds by name', () => {
    expect(findExercise('Lat Pulldown')?.muscle_group).toBe('Back')
    expect(findExercise('Nope')).toBeUndefined()
  })
})
