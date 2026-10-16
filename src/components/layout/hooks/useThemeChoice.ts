import { useSyncExternalStore } from 'react'
import { chooseTheme, readThemeChoice, subscribeToThemeChoice, type ThemeChoice } from '@/stores/themeStore'

export function useThemeChoice(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const choice = useSyncExternalStore(subscribeToThemeChoice, readThemeChoice, () => 'system' as const)
  return [choice, chooseTheme]
}
