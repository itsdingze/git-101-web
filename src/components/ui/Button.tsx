import type { ComponentProps, ElementType, ReactNode, Ref } from 'react'

type ButtonVariant = 'filled' | 'outlined' | 'text' | 'filled-success' | 'filled-danger'

const base =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium ' +
  'transition-colors duration-150 cursor-pointer select-none no-underline ' +
  'disabled:cursor-not-allowed ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

const variants: Record<ButtonVariant, string> = {
  filled:
    'bg-text-primary text-white ' +
    'hover:bg-btn-filled-hover active:bg-btn-filled-active ' +
    'disabled:bg-text-primary/12 disabled:text-text-primary/38 disabled:hover:bg-text-primary/12',
  outlined:
    'bg-transparent text-text-primary border border-border ' +
    'hover:bg-text-primary/8 hover:border-text-muted active:bg-text-primary/12 ' +
    'disabled:bg-transparent disabled:text-text-primary/38 disabled:border-text-primary/12 disabled:hover:bg-transparent',
  text:
    'bg-transparent text-text-secondary ' +
    'hover:bg-text-secondary/8 active:bg-text-secondary/12 ' +
    'disabled:text-text-primary/38 disabled:hover:bg-transparent',
  'filled-success':
    'bg-accent-green text-white ' +
    'hover:bg-accent-green-dark active:bg-accent-green-dark ' +
    'disabled:bg-accent-green/40 disabled:text-white/70 disabled:hover:bg-accent-green/40',
  'filled-danger':
    'bg-accent-red text-white ' +
    'hover:bg-accent-red/90 active:bg-accent-red/80 ' +
    'disabled:bg-accent-red/40 disabled:text-white/70 disabled:hover:bg-accent-red/40',
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
