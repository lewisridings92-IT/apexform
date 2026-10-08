import { findExercise } from '@/lib/exercises'
import { db } from './db'
import type { AnchorExercise, MuscleGroup } from './types'

// Anchor choices per muscle group, in order; the first one is the primary lift.
export type AnchorSelection = Partial<Record<MuscleGroup, string[]>>

export async function getAnchors(): Promise<AnchorExercise[]> {
  return db.anchors.toArray()
}

export function toSelection(anchors: AnchorExercise[]): AnchorSelection {
  const selection: AnchorSelection = {}
  // Primary first, then in saved order.
  const sorted = [...anchors].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
  for (const a of sorted) {
    ;(selection[a.muscle_group] ??= []).push(a.exercise_name)
  }
  return selection
}

// Replaces all saved anchors in one transaction.
export async function replaceAnchors(selection: AnchorSelection): Promise<void> {
  const rows: AnchorExercise[] = []
  for (const [muscle, names] of Object.entries(selection) as [MuscleGroup, string[]][]) {
    names.forEach((name, i) => {
      const ex = findExercise(name)
      if (!ex) return
      rows.push({ muscle_group: muscle, exercise_name: name, equipment: ex.equipment, is_primary: i === 0 })
    })
  }
  await db.transaction('rw', db.anchors, async () => {
    await db.anchors.clear()
    await db.anchors.bulkAdd(rows)
  })
}
