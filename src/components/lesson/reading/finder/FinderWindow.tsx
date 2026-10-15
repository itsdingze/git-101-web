import { useEffect, useRef } from 'react'
import type { FilesBlock } from '@/types'
import { WindowFrame } from '@/components/lesson/window/WindowFrame'
import { useFinderNavigation } from './hooks/useFinderNavigation'
import { FinderGrid } from './components/FinderGrid'
import { FinderNavButtons } from './components/FinderNavButtons'
import { FinderPathBar } from './components/FinderPathBar'

const ROOT_TITLE = '/'

interface FinderWindowProps {
  block: FilesBlock
}

export function FinderWindow({ block }: FinderWindowProps) {
  const { location, entries, canGoBack, canGoForward, open, enter, goBack, goForward } = useFinderNavigation(block)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [location])

  return (
    <WindowFrame
      skin="finder"
      title={location[location.length - 1] ?? ROOT_TITLE}
      titleBarControls={
        <FinderNavButtons canGoBack={canGoBack} canGoForward={canGoForward} onBack={goBack} onForward={goForward} />
      }
      statusBar={<FinderPathBar location={location} onOpen={open} />}
      ref={bodyRef}
    >
      <FinderGrid location={location} entries={entries} onEnter={enter} />
    </WindowFrame>
  )
}
