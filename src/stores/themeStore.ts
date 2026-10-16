export type ThemeChoice = 'system' | 'light' | 'dark'
type Theme = Exclude<ThemeChoice, 'system'>

const STORAGE_KEY = 'git-101-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'
const CHOICES: readonly string[] = ['system', 'light', 'dark'] satisfies ThemeChoice[]

let unsaved: ThemeChoice | null = null
const listeners = new Set<() => void>()

function isThemeChoice(value: string | null): value is ThemeChoice {
  return value !== null && CHOICES.includes(value)
}

export function readThemeChoice(): ThemeChoice {
  if (unsaved) return unsaved
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isThemeChoice(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function resolveTheme(choice: ThemeChoice): Theme {
  if (choice !== 'system') return choice
  return matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function withoutTransitions(change: () => void) {
  const pause = document.createElement('style')
  pause.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.append(pause)
  change()
  // Browsers defer style changes; forcing a style read applies the pause before it is removed.
  void getComputedStyle(document.body).opacity
  setTimeout(() => pause.remove(), 1)
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const dark = theme === 'dark'
  if (root.classList.contains('dark') === dark) return
  withoutTransitions(() => {
    root.classList.toggle('dark', dark)
  })
}

export function chooseTheme(choice: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
    unsaved = null
  } catch {
    unsaved = choice
  }
  applyTheme(resolveTheme(choice))
  listeners.forEach((listener) => listener())
}

export function subscribeToThemeChoice(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function watchSystemTheme(): () => void {
  const query = matchMedia(DARK_QUERY)
  const follow = () => applyTheme(resolveTheme(readThemeChoice()))
  query.addEventListener('change', follow)
  return () => query.removeEventListener('change', follow)
}
