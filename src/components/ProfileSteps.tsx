import { OptionCard } from '@/components/OptionCard'
import { Slider } from '@/components/ui/slider'
import type { UserProfile } from '@/db/types'
import { EQUIPMENT, EXPERIENCE, FREQUENCY, GOALS, SESSION_LENGTH } from '@/lib/options'
import { cn } from '@/lib/utils'

// Each step edits part of the profile. Settings (Phase 7) reuses these.
type StepProps = {
  profile: UserProfile
  onChange: (patch: Partial<UserProfile>) => void
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export function ScheduleStep({ profile, onChange }: StepProps) {
  const days = Array.from({ length: FREQUENCY.max - FREQUENCY.min + 1 }, (_, i) => FREQUENCY.min + i)

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-medium">Days per week</h2>
        <div className="grid grid-cols-6 gap-2">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={profile.frequency === d}
              onClick={() => onChange({ frequency: d })}
              className={cn(
                'rounded-xl border border-border bg-card py-3 text-lg font-semibold',
                profile.frequency === d && 'border-primary bg-primary text-primary-foreground',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Session length</h2>
          <span className="text-2xl font-semibold tabular-nums">
            {profile.session_length}
            <span className="ml-1 text-sm font-normal text-muted-foreground">min</span>
          </span>
        </div>
        <Slider
          value={[profile.session_length]}
          min={SESSION_LENGTH.min}
          max={SESSION_LENGTH.max}
          step={SESSION_LENGTH.step}
          onValueChange={(v) => onChange({ session_length: Array.isArray(v) ? v[0] : v })}
          aria-label="Session length in minutes"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{SESSION_LENGTH.min} min</span>
          <span>{SESSION_LENGTH.max} min</span>
        </div>
      </section>
    </div>
  )
}

export function EquipmentStep({ profile, onChange }: StepProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {EQUIPMENT.map((e) => (
        <OptionCard
          key={e}
          label={e}
          selected={profile.equipment.includes(e)}
          onClick={() => onChange({ equipment: toggle(profile.equipment, e) })}
        />
      ))}
    </div>
  )
}

export function GoalsStep({ profile, onChange }: StepProps) {
  return (
    <div className="space-y-2">
      {GOALS.map((g) => (
        <OptionCard
          key={g.value}
          label={g.label}
          description={g.description}
          selected={profile.goals.includes(g.value)}
          onClick={() => onChange({ goals: toggle(profile.goals, g.value) })}
        />
      ))}
    </div>
  )
}

export function ExperienceStep({ profile, onChange }: StepProps) {
  return (
    <div className="space-y-2">
      {EXPERIENCE.map((x) => (
        <OptionCard
          key={x.value}
          label={x.label}
          description={x.description}
          selected={profile.experience_level === x.value}
          onClick={() => onChange({ experience_level: x.value })}
        />
      ))}
    </div>
  )
}
