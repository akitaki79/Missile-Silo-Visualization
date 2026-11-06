import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface UnitInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Shown inside the right edge, e.g. "m". */
  unit?: string
  error?: string
  hint?: string
  inputMode?: ComponentProps<'input'>['inputMode']
}

/**
 * Labelled text input with an optional unit suffix and inline error.
 * Uses type="text" + inputMode rather than type="number", so partial entries
 * like "0." aren't silently dropped; validation happens in the reducer.
 */
export function UnitInput({
  label,
  value,
  onChange,
  unit,
  error,
  hint,
  inputMode = 'decimal',
}: UnitInputProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn('bg-card tabular-nums', unit && 'pr-11')}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-px right-px flex w-9 items-center justify-center border-l border-input text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {message}
        </p>
      )}
    </div>
  )
}
