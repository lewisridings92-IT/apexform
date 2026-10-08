import type { Equipment, MuscleGroup } from '@/db/types'

export interface Exercise {
  name: string
  muscle_group: MuscleGroup
  equipment: Equipment
  // Multi-joint lifts go first in a session and get lower rep ranges.
  compound: boolean
}

type Row = [name: string, equipment: Equipment, compound: boolean]

const C = true // compound
const I = false // isolation

// Grouped by the main muscle trained. Names are unique across the library.
// Order matters: without anchors, the plan generator prefers earlier entries.
const LIBRARY: Record<MuscleGroup, Row[]> = {
  Chest: [
    ['Barbell Bench Press', 'Barbell', C],
    ['Incline Barbell Bench Press', 'Barbell', C],
    ['Dumbbell Bench Press', 'Dumbbell', C],
    ['Incline DB Press', 'Dumbbell', C],
    ['Dumbbell Fly', 'Dumbbell', I],
    ['Machine Chest Press', 'Machine', C],
    ['Incline Machine Press', 'Machine', C],
    ['Pec Deck', 'Machine', I],
    ['Cable Crossover', 'Cable', I],
    ['Weighted Dips', 'Bodyweight', C],
    ['Push-Up', 'Bodyweight', C],
    ['Kettlebell Floor Press', 'Kettlebell', C],
    ['Band Chest Press', 'Bands', C],
  ],
  Back: [
    ['Barbell Row', 'Barbell', C],
    ['Lat Pulldown', 'Cable', C],
    ['Pull-Up', 'Bodyweight', C],
    ['Chest-Supported DB Row', 'Dumbbell', C],
    ['Seated Cable Row', 'Cable', C],
    ['One-Arm Dumbbell Row', 'Dumbbell', C],
    ['Machine Row', 'Machine', C],
    ['T-Bar Row', 'Machine', C],
    ['Pendlay Row', 'Barbell', C],
    ['Weighted Pull-Up', 'Bodyweight', C],
    ['Chin-Up', 'Bodyweight', C],
    ['Conventional Deadlift', 'Barbell', C],
    ['Straight-Arm Pulldown', 'Cable', I],
    ['Kettlebell Row', 'Kettlebell', C],
    ['Band Lat Pulldown', 'Bands', C],
  ],
  Shoulders: [
    ['Overhead Press', 'Barbell', C],
    ['Seated DB Shoulder Press', 'Dumbbell', C],
    ['Arnold Press', 'Dumbbell', C],
    ['Dumbbell Lateral Raise', 'Dumbbell', I],
    ['Rear Delt DB Fly', 'Dumbbell', I],
    ['Machine Shoulder Press', 'Machine', C],
    ['Machine Lateral Raise', 'Machine', I],
    ['Reverse Pec Deck', 'Machine', I],
    ['Cable Lateral Raise', 'Cable', I],
    ['Face Pull', 'Cable', I],
    ['Pike Push-Up', 'Bodyweight', C],
    ['Kettlebell Press', 'Kettlebell', C],
    ['Band Pull-Apart', 'Bands', I],
  ],
  Quads: [
    ['Back Squat', 'Barbell', C],
    ['Front Squat', 'Barbell', C],
    ['Bulgarian Split Squat', 'Dumbbell', C],
    ['Dumbbell Walking Lunge', 'Dumbbell', C],
    ['Leg Press', 'Machine', C],
    ['Hack Squat', 'Machine', C],
    ['Belt Squat', 'Machine', C],
    ['Leg Extension', 'Machine', I],
    ['Pistol Squat', 'Bodyweight', C],
    ['Sissy Squat', 'Bodyweight', I],
    ['Goblet Squat', 'Kettlebell', C],
    ['Banded Squat', 'Bands', C],
  ],
  Hamstrings: [
    ['Romanian Deadlift', 'Barbell', C],
    ['Dumbbell RDL', 'Dumbbell', C],
    ['Good Morning', 'Barbell', C],
    ['Stiff-Leg Deadlift', 'Barbell', C],
    ['Lying Leg Curl', 'Machine', I],
    ['Seated Leg Curl', 'Machine', I],
    ['Cable Pull-Through', 'Cable', C],
    ['Nordic Curl', 'Bodyweight', I],
    ['Kettlebell Swing', 'Kettlebell', C],
    ['Band Leg Curl', 'Bands', I],
  ],
  Glutes: [
    ['Barbell Hip Thrust', 'Barbell', C],
    ['Machine Hip Thrust', 'Machine', C],
    ['Dumbbell Step-Up', 'Dumbbell', C],
    ['Sumo Deadlift', 'Barbell', C],
    ['Hip Abduction Machine', 'Machine', I],
    ['Cable Kickback', 'Cable', I],
    ['Single-Leg Glute Bridge', 'Bodyweight', I],
    ['45° Back Extension', 'Bodyweight', I],
    ['Kettlebell Sumo Deadlift', 'Kettlebell', C],
    ['Banded Glute Bridge', 'Bands', I],
  ],
  Calves: [
    ['Barbell Calf Raise', 'Barbell', I],
    ['Single-Leg DB Calf Raise', 'Dumbbell', I],
    ['Standing Calf Raise', 'Machine', I],
    ['Seated Calf Raise', 'Machine', I],
    ['Leg Press Calf Raise', 'Machine', I],
    ['Bodyweight Calf Raise', 'Bodyweight', I],
  ],
  Biceps: [
    ['Barbell Curl', 'Barbell', I],
    ['EZ Bar Curl', 'EZ Bar', I],
    ['EZ Bar Preacher Curl', 'EZ Bar', I],
    ['Dumbbell Curl', 'Dumbbell', I],
    ['Incline Dumbbell Curl', 'Dumbbell', I],
    ['Hammer Curl', 'Dumbbell', I],
    ['Machine Preacher Curl', 'Machine', I],
    ['Cable Curl', 'Cable', I],
    ['Close-Grip Chin-Up', 'Bodyweight', C],
    ['Band Curl', 'Bands', I],
  ],
  Triceps: [
    ['Close-Grip Bench Press', 'Barbell', C],
    ['EZ Bar Skull Crusher', 'EZ Bar', I],
    ['Dumbbell Overhead Extension', 'Dumbbell', I],
    ['Machine Dip', 'Machine', C],
    ['Cable Pushdown', 'Cable', I],
    ['Overhead Cable Extension', 'Cable', I],
    ['Dips', 'Bodyweight', C],
    ['Diamond Push-Up', 'Bodyweight', C],
    ['Band Pushdown', 'Bands', I],
  ],
  Abs: [
    ['Weighted Decline Sit-Up', 'Dumbbell', I],
    ['Machine Crunch', 'Machine', I],
    ['Cable Crunch', 'Cable', I],
    ['Pallof Press', 'Cable', I],
    ['Hanging Leg Raise', 'Bodyweight', I],
    ['Ab Wheel Rollout', 'Bodyweight', I],
    ['Plank', 'Bodyweight', I],
    ['Band Pallof Press', 'Bands', I],
  ],
  Forearms: [
    ['Barbell Wrist Curl', 'Barbell', I],
    ['Reverse EZ Bar Curl', 'EZ Bar', I],
    ['Dumbbell Wrist Curl', 'Dumbbell', I],
    ["Farmer's Carry", 'Dumbbell', I],
    ['Cable Reverse Curl', 'Cable', I],
    ['Dead Hang', 'Bodyweight', I],
    ["Kettlebell Farmer's Carry", 'Kettlebell', I],
  ],
}

export const EXERCISES: Exercise[] = Object.entries(LIBRARY).flatMap(([muscle, rows]) =>
  rows.map(([name, equipment, compound]) => ({
    name,
    muscle_group: muscle as MuscleGroup,
    equipment,
    compound,
  })),
)

const BY_NAME = new Map(EXERCISES.map((e) => [e.name, e]))

// Done for time rather than reps.
const TIMED = new Set(['Plank', 'Dead Hang', "Farmer's Carry", "Kettlebell Farmer's Carry"])

export function isTimed(name: string): boolean {
  return TIMED.has(name)
}

export function findExercise(name: string): Exercise | undefined {
  return BY_NAME.get(name)
}

// Exercises for one muscle group that use only the given equipment.
export function exercisesFor(muscle: MuscleGroup, equipment: Equipment[]): Exercise[] {
  return EXERCISES.filter((e) => e.muscle_group === muscle && equipment.includes(e.equipment))
}
