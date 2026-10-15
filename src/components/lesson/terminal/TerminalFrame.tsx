import type { ComponentPropsWithRef } from 'react'
import { WindowFrame } from '@/components/lesson/window/WindowFrame'

type TerminalFrameProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'title'> & {
  title: string
}

export function TerminalFrame({ title, children, ...bodyProps }: TerminalFrameProps) {
  return (
    <WindowFrame skin="terminal" title={title} {...bodyProps}>
      <div className="space-y-1 p-4 font-mono text-sm whitespace-pre-wrap wrap-break-word">{children}</div>
    </WindowFrame>
  )
}
