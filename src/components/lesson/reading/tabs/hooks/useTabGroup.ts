import { useCallback, useSyncExternalStore } from 'react'
import { initialTabIndex, platformHint } from '@/components/lesson/reading/tabs/model/tabChoice'
import { chooseTab, readTabChoice, subscribeToTabChoices } from '@/components/lesson/reading/tabs/model/tabChoiceStore'

function currentHint() {
  return typeof navigator === 'undefined' ? null : platformHint(navigator.userAgent)
}

export function useTabGroup(group: string, labels: readonly string[]): [number, (index: number) => void] {
  const stored = useSyncExternalStore(
    subscribeToTabChoices,
    () => readTabChoice(group),
    () => null,
  )

  const select = useCallback(
    (index: number) => {
      const label = labels[index]
      if (label !== undefined) chooseTab(group, label)
    },
    [group, labels],
  )

  return [initialTabIndex(labels, stored, currentHint()), select]
}
