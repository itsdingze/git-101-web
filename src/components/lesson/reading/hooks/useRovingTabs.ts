import { type KeyboardEvent, useRef } from 'react'
import { tabKeyTarget } from '@/components/lesson/reading/model/tabKeys'

interface RovingTabs {
  tabRef: (index: number) => (element: HTMLButtonElement | null) => void
  handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

export function useRovingTabs(selected: number, count: number, onSelect: (index: number) => void): RovingTabs {
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  function tabRef(index: number) {
    return (element: HTMLButtonElement | null) => {
      tabs.current[index] = element
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next = tabKeyTarget(event.key, selected, count)
    if (next === null) return
    event.preventDefault()
    onSelect(next)
    tabs.current[next]?.focus()
  }

  return { tabRef, handleKeyDown }
}
