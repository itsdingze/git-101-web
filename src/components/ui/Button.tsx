import type { ComponentProps, ElementType, ReactNode, Ref } from 'react'

type ButtonVariant = 'filled' | 'outlined' | 'text' | 'filled-success' | 'filled-danger'

const base =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium ' +
  'transition-colors duration-150 cursor-pointer select-none no-underline ' +
  'disabled:cursor-not-allowed ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

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

interface ButtonProps extends ComponentProps<'button'> {
  as?: ElementType
  variant?: ButtonVariant
  to?: string
  ref?: Ref<HTMLButtonElement>
  children?: ReactNode
}

export default function Button({
  as: Tag = 'button', variant = 'filled', className = '', ref, children, ...rest
}: ButtonProps) {
  return (
    <Tag ref={ref} className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
