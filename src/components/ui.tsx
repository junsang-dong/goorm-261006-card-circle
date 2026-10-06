import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/format'

export function Icon({ name, filled = false, className }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('material-symbols-outlined', className)}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-1 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-primary-container text-on-primary',
        variant === 'secondary' && 'border border-[#bfdbfe] bg-[#eff6ff] text-primary-container',
        variant === 'ghost' && 'border border-outline-variant bg-surface-container-lowest text-on-surface',
        variant === 'danger' && 'bg-error-container text-on-error-container',
        className,
      )}
      {...props}
    />
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-on-surface-variant">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-on-surface-variant">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export const fieldClass =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface placeholder:text-outline'

export function StackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-[var(--shell-top)] z-30 flex h-14 items-center gap-1 border-b border-surface-container bg-surface-container-lowest/90 px-2 backdrop-blur-xl">
      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full" onClick={onBack} aria-label="뒤로">
        <Icon name="arrow_back_ios_new" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
    </header>
  )
}
