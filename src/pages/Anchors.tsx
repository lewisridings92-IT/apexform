import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ChevronDown, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type AnchorSelection, getAnchors, replaceAnchors, toSelection } from '@/db/anchors'
import { getProfile } from '@/db/profile'
import type { MuscleGroup } from '@/db/types'
import { type Exercise, exercisesFor } from '@/lib/exercises'
import { MUSCLE_GROUPS } from '@/lib/options'
import { cn } from '@/lib/utils'

export function Anchors() {
  const navigate = useNavigate()
  const profile = useLiveQuery(getProfile, [])
  const [selection, setSelection] = useState<AnchorSelection>()
  const [open, setOpen] = useState<MuscleGroup | null>('Chest')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAnchors().then((a) => setSelection(toSelection(a)))
  }, [])

  if (!profile || !selection) return null

  const total = Object.values(selection).reduce((n, names) => n + names.length, 0)

  function update(muscle: MuscleGroup, names: string[]) {
    setSelection({ ...selection, [muscle]: names })
  }

  async function save() {
    setSaving(true)
    await replaceAnchors(selection!)
    // Phase 4: generate the plan here and go to /plan.
    navigate('/', { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Anchor lifts"
        subtitle="Pick the exercises you know work for you. Your plan is built around them. The starred lift in each group is your main one."
      />

      <div className="space-y-2">
        {MUSCLE_GROUPS.map((muscle) => (
          <MuscleSection
            key={muscle}
            muscle={muscle}
            options={exercisesFor(muscle, profile.equipment)}
            chosen={selection[muscle] ?? []}
            open={open === muscle}
            onToggleOpen={() => setOpen(open === muscle ? null : muscle)}
            onChange={(names) => update(muscle, names)}
          />
        ))}
      </div>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] mt-6 space-y-2 bg-background/95 py-3 backdrop-blur">
        <Button size="lg" className="w-full" disabled={saving} onClick={save}>
          Save {total} anchor {total === 1 ? 'lift' : 'lifts'}
        </Button>
        <Button variant="ghost" className="w-full" render={<Link to="/" />}>
          Skip for now
        </Button>
      </div>
    </>
  )
}

function MuscleSection({
  muscle, options, chosen, open, onToggleOpen, onChange,
}: {
  muscle: MuscleGroup
  options: Exercise[]
  chosen: string[]
  open: boolean
  onToggleOpen: () => void
  onChange: (names: string[]) => void
}) {
  function toggle(name: string) {
    onChange(chosen.includes(name) ? chosen.filter((n) => n !== name) : [...chosen, name])
  }

  function makePrimary(name: string) {
    onChange([name, ...chosen.filter((n) => n !== name)])
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggleOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="flex-1">
          <span className="block font-medium">{muscle}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {chosen.length ? chosen.join(', ') : 'None chosen'}
          </span>
        </span>
        {chosen.length > 0 && <Badge variant="secondary">{chosen.length}</Badge>}
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="border-t border-border px-2 py-2">
          {options.length === 0 && (
            <li className="px-2 py-2 text-sm text-muted-foreground">
              Nothing matches your equipment.
            </li>
          )}
          {options.map((ex) => {
            const selected = chosen.includes(ex.name)
            const primary = chosen[0] === ex.name
            return (
              <li key={ex.name} className="flex items-center">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggle(ex.name)}
                  className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2.5 text-left"
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md border border-border',
                      selected && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {selected && <Check className="size-3.5" />}
                  </span>
                  <span className="flex-1">
                    {ex.name}
                    <span className="ml-2 text-xs text-muted-foreground">{ex.equipment}</span>
                  </span>
                </button>
                {selected && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={primary ? `${ex.name} is the main lift` : `Make ${ex.name} the main lift`}
                    aria-pressed={primary}
                    onClick={() => makePrimary(ex.name)}
                  >
                    <Star className={cn('size-4', primary ? 'fill-current text-yellow-400' : 'text-muted-foreground')} />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
