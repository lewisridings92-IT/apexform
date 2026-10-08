import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// Numeric input that allows partial typing like "102." and shows the iPhone number pad.
// 0 is shown as empty so the placeholder (a suggestion) is visible.
export function NumberField({
  value,
  onChange,
  decimal = false,
  placeholder,
  className,
  ...aria
}: {
  value: number
  onChange: (value: number) => void
  decimal?: boolean
  placeholder?: string
  className?: string
  'aria-label': string
}) {
  const [text, setText] = useState(value ? String(value) : '')
  const focused = useRef(false)

  // Follow outside changes (e.g. a set filled in from the placeholder) unless the user is typing.
  useEffect(() => {
    if (!focused.current) setText(value ? String(value) : '')
  }, [value])

  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      autoComplete="off"
      value={text}
      placeholder={placeholder}
      onFocus={(e) => {
        focused.current = true
        e.target.select()
      }}
      onBlur={() => {
        focused.current = false
        setText(value ? String(value) : '')
      }}
      onChange={(e) => {
        // Accept a comma as the decimal point too.
        const next = e.target.value.replace(',', '.')
        if (!(decimal ? /^\d*\.?\d*$/ : /^\d*$/).test(next)) return
        setText(next)
        onChange(next === '' || next === '.' ? 0 : Number(next))
      }}
      // 16px text stops iPhone Safari zooming in on focus.
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-background px-2 text-center text-base tabular-nums placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none',
        className,
      )}
      {...aria}
    />
  )
}
