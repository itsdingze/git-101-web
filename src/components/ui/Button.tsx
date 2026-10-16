import type { ComponentPropsWithRef, ElementType } from 'react'
import { FOCUS_RING } from './focusRing'

type ButtonVariant = 'filled' | 'outlined' | 'text' | 'filled-success' | 'waiting'
type ButtonSize = 'sm' | 'md' | 'icon'

const base =
  'inline-flex items-center justify-center rounded-lg font-medium ' +
  'transition-colors duration-150 cursor-pointer select-none no-underline ' +
  `disabled:cursor-not-allowed ${FOCUS_RING}`

const sizes: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-3 py-1.5 text-sm',
  md: 'min-h-11 gap-2 px-4 py-2.5 text-sm sm:px-5',
  icon: 'size-11',
}

const variants: Record<ButtonVariant, string> = {
  filled:
    'bg-btn-filled text-text-on-accent ' +
    'hover:bg-btn-filled-hover active:bg-btn-filled-active ' +
    'disabled:bg-border disabled:text-text-muted disabled:hover:bg-border',
  outlined:
    'bg-transparent text-text-muted border border-border ' +
    'hover:bg-bg-secondary active:bg-bg-card ' +
    'disabled:bg-transparent disabled:text-border disabled:hover:bg-transparent',
  text:
    'bg-transparent text-text-secondary ' +
    'hover:bg-text-secondary/8 active:bg-text-secondary/12 ' +
    'disabled:text-text-primary/38 disabled:hover:bg-transparent',
  'filled-success':
    'bg-btn-filled text-text-on-accent ' +
    'hover:bg-btn-filled-hover active:bg-btn-filled-active ' +
    'disabled:bg-btn-filled disabled:text-text-on-accent',
  waiting:
    'bg-bg-secondary text-text-secondary border border-border ' +
    'disabled:cursor-default disabled:bg-bg-secondary disabled:text-text-secondary',
}

type ButtonProps<T extends ElementType> = {
  as?: T
  variant?: ButtonVariant
  size?: ButtonSize
} & Omit<ComponentPropsWithRef<T>, 'as' | 'className'> & { className?: string }

export function Button<T extends ElementType = 'button'>({
  as, variant = 'filled', size = 'md', className = '', ...rest
}: ButtonProps<T>) {
  const Tag = as ?? 'button'
  const nativeType = Tag === 'button' ? { type: 'button' as const } : {}

  return (
    <Tag
      {...nativeType}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}
