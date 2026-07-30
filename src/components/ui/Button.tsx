import type { ComponentPropsWithRef, ElementType } from 'react'

type ButtonVariant = 'filled' | 'outlined' | 'text' | 'filled-success' | 'filled-danger'
type ButtonSize = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center rounded-lg font-medium ' +
  'transition-colors duration-150 cursor-pointer select-none no-underline ' +
  'disabled:cursor-not-allowed ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

const sizes: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-3 py-1.5 text-sm',
  md: 'min-h-11 gap-2 px-4 py-2.5 text-sm sm:px-5',
}

const variants: Record<ButtonVariant, string> = {
  filled:
    'bg-accent-green text-white ' +
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
    'bg-accent-green text-white ' +
    'hover:bg-btn-filled-hover active:bg-accent-green-dark ' +
    'disabled:bg-accent-green disabled:text-white',
  'filled-danger':
    'bg-accent-red text-white ' +
    'hover:bg-accent-red-dark active:bg-accent-red-dark ' +
    'disabled:bg-accent-red disabled:text-white',
}

type ButtonProps<T extends ElementType> = {
  as?: T
  variant?: ButtonVariant
  size?: ButtonSize
} & Omit<ComponentPropsWithRef<T>, 'as' | 'className'> & { className?: string }

export default function Button<T extends ElementType = 'button'>({
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
