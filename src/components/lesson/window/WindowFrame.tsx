import type { ComponentPropsWithRef, ReactNode } from 'react'
import { FOCUS_WITHIN_RING } from '@/components/ui/focusRing'

type WindowSkin = 'terminal' | 'editor' | 'finder'

const DARK_SKIN = {
  frame: 'bg-terminal-bg border-terminal-border',
  bar: 'bg-terminal-bar border-terminal-border',
  title: 'ml-2 font-mono text-sm text-terminal-muted',
}

const SKINS: Record<WindowSkin, typeof DARK_SKIN> = {
  terminal: DARK_SKIN,
  editor: {
    frame: 'bg-editor-bg border-editor-border',
    bar: 'bg-editor-chrome border-editor-border',
    title: 'flex-1 pr-15 text-center font-sans text-xs leading-5 text-editor-muted',
  },
  finder: {
    frame: 'bg-bg-primary border-border',
    bar: 'bg-bg-secondary border-border',
    title: 'ml-2 font-sans text-sm font-semibold text-text-primary',
  },
}

type WindowFrameProps = Omit<ComponentPropsWithRef<'div'>, 'className' | 'title'> & {
  skin: WindowSkin
  title: string
  titleBarControls?: ReactNode
  toolbar?: ReactNode
  sidebar?: ReactNode
  statusBar?: ReactNode
}

export function WindowFrame({
  skin,
  title,
  titleBarControls,
  toolbar,
  sidebar,
  statusBar,
  children,
  ...bodyProps
}: WindowFrameProps) {
  const { frame, bar, title: titleStyle } = SKINS[skin]

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border ${FOCUS_WITHIN_RING} ${frame}`}
    >
      <div className={`flex shrink-0 items-center gap-2 border-b p-2 ${bar}`}>
        <span aria-hidden className="contents">
          <span className="size-3 shrink-0 rounded-full bg-window-close" />
          <span className="size-3 shrink-0 rounded-full bg-window-minimize" />
          <span className="size-3 shrink-0 rounded-full bg-window-maximize" />
        </span>
        {titleBarControls}
        <span aria-hidden className={`min-w-0 truncate ${titleStyle}`}>{title}</span>
      </div>

      <div className="flex h-(--window-body-height) flex-col">
        <div className="flex min-h-0 flex-1">
          {sidebar}
          <div className="flex min-w-0 flex-1 flex-col">
            {toolbar}
            <div {...bodyProps} className="min-h-0 flex-1 overflow-auto outline-none">
              {children}
            </div>
          </div>
        </div>
        {statusBar}
      </div>
    </div>
  )
}
