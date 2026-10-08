// Shapes mirror the Base44 entities (see PLAN.md → Data model).

export type Equipment =
  | 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable'
  | 'Kettlebell' | 'Bodyweight' | 'Bands' | 'EZ Bar'

export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders' | 'Quads' | 'Hamstrings' | 'Glutes'
  | 'Calves' | 'Biceps' | 'Triceps' | 'Abs' | 'Forearms'

export type Goal =
  | 'maximal_strength' | 'hypertrophy' | 'power' | 'body_recomp' | 'general_fitness'

export type ExperienceLevel = 'intermediate' | 'advanced' | 'elite'

export interface UserProfile {
  id?: number
  frequency: number // days per week, 2–7
  session_length: number // minutes, 30–120
  equipment: Equipment[]
  goals: Goal[]
  experience_level: ExperienceLevel
  onboarding_complete: boolean
}

export interface AnchorExercise {
  id?: number
  muscle_group: MuscleGroup
  exercise_name: string
  equipment: Equipment
  is_primary: boolean
}

export interface PlanExercise {
  name: string
  muscle_group: MuscleGroup
  sets: number
  reps: string // e.g. "6-8"
  rir: string // e.g. "1-2"
  rest: string // e.g. "2-3 min"
  notes?: string
}

export interface PlanDay {
  day_name: string
  focus: string
  exercises: PlanExercise[]
}

export interface WorkoutPlan {
  id?: number
  name: string
  block_type: string
  summary: string
  status: 'active' | 'archived'
  created_at: string // ISO date-time
  days: PlanDay[]
}

export interface LoggedSet {
  weight: number // kg
  reps: number
  rir?: number
  completed: boolean
}

export interface LoggedExercise {
  name: string
  muscle_group: MuscleGroup
  target_sets: number
  target_reps: string
  target_rir: string
  target_rest?: string // e.g. "2-3 min"; drives the rest timer
  sets: LoggedSet[]
}

export interface WorkoutLog {
  id?: number
  date: string // ISO date-time the session started
  day_name: string
  duration_min: number
  // in_progress logs are saved after every set so a session survives a reload
  status: 'in_progress' | 'complete'
  exercises: LoggedExercise[]
}

// Small key/value store for app state such as the last backup time.
export interface Setting {
  key: string
  value: unknown
}
