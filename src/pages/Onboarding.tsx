import { ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  EquipmentStep, ExperienceStep, GoalsStep, ScheduleStep,
} from '@/components/ProfileSteps'
import { Button } from '@/components/ui/button'
import { generateAndSavePlan } from '@/db/plans'
import { getProfile, saveProfile, validateProfile } from '@/db/profile'
import type { UserProfile } from '@/db/types'
import { DEFAULT_PROFILE } from '@/lib/options'
import { cn } from '@/lib/utils'

const STEPS = [
  { title: 'Your schedule', subtitle: 'How often and how long can you train?', Component: ScheduleStep },
  { title: 'Equipment', subtitle: 'Choose everything you have access to.', Component: EquipmentStep },
  { title: 'Goals', subtitle: 'Choose one or more.', Component: GoalsStep },
  { title: 'Experience', subtitle: 'How long have you trained consistently?', Component: ExperienceStep },
]

export function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  // Start from the saved profile if onboarding is being redone.
  useEffect(() => {
    getProfile().then((saved) => {
      if (!saved) return
      setProfile(saved)
      setEditing(saved.onboarding_complete)
    })
  }, [])

  const { title, subtitle, Component } = STEPS[step]
  const isLast = step === STEPS.length - 1
  const stepError =
    (step === 1 && profile.equipment.length === 0 && 'Choose at least one type of equipment') ||
    (step === 2 && profile.goals.length === 0 && 'Choose at least one goal') ||
    null

  async function finish() {
    const done = { ...profile, onboarding_complete: true }
    if (validateProfile(done)) return
    setSaving(true)
    await saveProfile(done)
    // A changed profile means the current plan no longer fits it.
    if (editing) await generateAndSavePlan()
    navigate(editing ? '/settings' : '/anchors', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back"
          className={cn(step === 0 && 'invisible')}
          onClick={() => setStep(step - 1)}
        >
          <ChevronLeft />
        </Button>
        <div className="flex flex-1 gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <div key={i} className={cn('h-1 flex-1 rounded-full bg-muted', i <= step && 'bg-primary')} />
          ))}
        </div>
        <span className="w-9 text-right text-sm text-muted-foreground tabular-nums">
          {step + 1}/{STEPS.length}
        </span>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>

      <div className="flex-1">
        <Component profile={profile} onChange={(patch) => setProfile({ ...profile, ...patch })} />
      </div>

      <div className="mt-6 space-y-2">
        {stepError && <p className="text-center text-sm text-destructive">{stepError}</p>}
        <Button
          size="lg"
          className="w-full"
          disabled={!!stepError || saving}
          onClick={isLast ? finish : () => setStep(step + 1)}
        >
          {isLast ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
