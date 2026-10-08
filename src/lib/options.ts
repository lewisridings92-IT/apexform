import type { Equipment, ExperienceLevel, Goal, MuscleGroup, UserProfile } from '@/db/types'

export const EQUIPMENT: Equipment[] = [
  'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Kettlebell', 'Bodyweight', 'Bands', 'EZ Bar',
]

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes',
  'Calves', 'Biceps', 'Triceps', 'Abs', 'Forearms',
]

export const GOALS: { value: Goal; label: string; description: string }[] = [
  { value: 'maximal_strength', label: 'Maximal strength', description: 'Heavy, low-rep work on the main lifts' },
  { value: 'hypertrophy', label: 'Hypertrophy', description: 'Build muscle with moderate reps and more volume' },
  { value: 'power', label: 'Power', description: 'Move weight fast; explosive, low-fatigue sets' },
  { value: 'body_recomp', label: 'Body recomposition', description: 'Keep strength while losing fat' },
  { value: 'general_fitness', label: 'General fitness', description: 'Balanced strength and conditioning' },
]

export const EXPERIENCE: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: 'intermediate', label: 'Intermediate', description: '2–4 years of consistent training' },
  { value: 'advanced', label: 'Advanced', description: '5+ years of consistent training' },
  { value: 'elite', label: 'Elite', description: 'Competitive or near your genetic ceiling' },
]

export const FREQUENCY = { min: 2, max: 7 }
export const SESSION_LENGTH = { min: 30, max: 120, step: 5 }

export const DEFAULT_PROFILE: UserProfile = {
  frequency: 4,
  session_length: 75,
  equipment: ['Barbell', 'Dumbbell', 'Cable', 'Machine'],
  goals: ['hypertrophy'],
  experience_level: 'advanced',
  onboarding_complete: false,
}

export function goalLabel(goal: Goal): string {
  return GOALS.find((g) => g.value === goal)?.label ?? goal
}
