import { useId, useMemo, useRef, type KeyboardEvent } from 'react'
import type { TabsBlock as TabsBlockType } from '@/types'
import ContentBlock from './ContentBlock'
import blockKey from './blockKey'
import useTabGroup from '@/components/lesson/reading/hooks/useTabGroup'

interface TabsBlockProps {
  block: TabsBlockType
}

const NEXT_INDEX: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_, count) => count - 1,
}

export default function TabsBlock({ block }: TabsBlockProps) {
  const baseId = useId()
  const labels = useMemo(() => block.tabs.map((tab) => tab.label), [block.tabs])
  const [selected, select] = useTabGroup(block.group, labels)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const active = block.tabs[selected]

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const move = NEXT_INDEX[event.key]
    if (!move) return
    event.preventDefault()
    const next = move(selected, block.tabs.length)
    select(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="rounded-xl border border-border">
      <div role="tablist" aria-label="Choose your computer" className="flex gap-1 border-b border-border p-1">
        {block.tabs.map((tab, index) => {
          const isSelected = index === selected
          return (
            <button
              key={tab.label}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={handleKeyDown}
              className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${
                isSelected
                  ? 'bg-bg-secondary text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${selected}`}
        className="space-y-4 p-4"
      >
        {active?.content.map((inner, index) => (
          <ContentBlock key={blockKey(inner, index)} block={inner} />
        ))}
      </div>
    </div>
  )
}
