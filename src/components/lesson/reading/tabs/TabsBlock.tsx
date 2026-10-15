import { useId, useMemo } from 'react'
import type { TabsBlock as TabsBlockType } from '@/types'
import { FOCUS_RING } from '@/components/ui/focusRing'
import { useTabGroup } from './hooks/useTabGroup'
import { useRovingTabs } from '@/components/lesson/reading/hooks/useRovingTabs'
import { ContentBlockList } from '@/components/lesson/reading/components/ContentBlockList'

interface TabsBlockProps {
  block: TabsBlockType
}

export function TabsBlock({ block }: TabsBlockProps) {
  const baseId = useId()
  const labels = useMemo(() => block.tabs.map((tab) => tab.label), [block.tabs])
  const [selected, select] = useTabGroup(block.group, labels)
  const { tabRef, handleKeyDown } = useRovingTabs(selected, block.tabs.length, select)
  const active = block.tabs[selected]

  return (
    <div className="rounded-xl border border-border">
      <div role="tablist" aria-label={block.label} className="flex gap-1 border-b border-border p-1">
        {block.tabs.map((tab, index) => {
          const isSelected = index === selected
          return (
            <button
              key={tab.label}
              ref={tabRef(index)}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={handleKeyDown}
              className={`min-h-11 flex-1 cursor-pointer rounded-lg px-3 text-sm font-medium transition-colors ${FOCUS_RING} ${
                isSelected
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-muted hover:bg-bg-secondary hover:text-text-secondary'
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
        {active && <ContentBlockList blocks={active.content} />}
      </div>
    </div>
  )
}
