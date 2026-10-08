import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Large tappable choice used for single- and multi-select lists.
export function OptionCard({
  label,
  description,
  selected,
  onClick,
  className,
}: {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors',
        selected && 'border-primary bg-primary/10',
        className,
      )}
    >
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {description && <span className="block text-sm text-muted-foreground">{description}</span>}
      </span>
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border border-border',
          selected && 'border-primary bg-primary text-primary-foreground',
        )}
      >
        {selected && <Check className="size-3.5" />}
      </span>
    </button>
  )
}
