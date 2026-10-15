import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import { FOCUS_RING_INSET_ON_DARK } from '@/components/ui/focusRing'
import { useRovingTabs } from '@/components/lesson/reading/hooks/useRovingTabs'
import { messages } from '@/messages/en'

const TAB =
  'flex min-h-10 min-w-0 shrink-0 items-center gap-1.5 border-t-2 border-r border-r-editor-border px-4 font-sans text-xs'
const ACTIVE_TAB = 'border-t-editor-accent bg-editor-bg text-editor-text'
const INACTIVE_TAB = 'border-t-transparent bg-editor-chrome text-editor-muted hover:text-editor-text'

function TabLabel({ fileName, isActive }: { fileName: string; isActive: boolean }): ReactNode {
  return (
    <>
      <FileText
        size={14}
        className={`shrink-0 ${isActive ? 'text-editor-operator' : 'text-editor-muted'}`}
        aria-hidden
      />
      <span className="truncate">{fileName}</span>
    </>
  )
}

interface EditorTabsProps {
  tabIds: readonly string[]
  panelId: string
  fileNames: readonly string[]
  selected: number
  onSelect: (index: number) => void
}

export function EditorTabs({ tabIds, panelId, fileNames, selected, onSelect }: EditorTabsProps) {
  const { tabRef, handleKeyDown } = useRovingTabs(selected, fileNames.length, onSelect)

  if (fileNames.length === 1) {
    return (
      <div className="flex shrink-0 bg-editor-chrome">
        <span id={tabIds[0]} className={`${TAB} ${ACTIVE_TAB}`}>
          <TabLabel fileName={fileNames[0] ?? ''} isActive />
        </span>
      </div>
    )
  }

  return (
    <div role="tablist" aria-label={messages.reading.openFiles} className="flex shrink-0 overflow-x-auto bg-editor-chrome">
      {fileNames.map((fileName, index) => {
        const isSelected = index === selected
        return (
          <button
            key={tabIds[index]}
            ref={tabRef(index)}
            type="button"
            role="tab"
            id={tabIds[index]}
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(index)}
            onKeyDown={handleKeyDown}
            className={`${TAB} cursor-pointer transition-colors ${FOCUS_RING_INSET_ON_DARK} ${
              isSelected ? ACTIVE_TAB : INACTIVE_TAB
            }`}
          >
            <TabLabel fileName={fileName} isActive={isSelected} />
          </button>
        )
      })}
    </div>
  )
}
