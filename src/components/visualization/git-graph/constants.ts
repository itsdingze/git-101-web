export const COMMIT_RADIUS = 8
export const COMMIT_SPACING_Y = 52
export const LANE_SPACING_X = 46
export const PADDING = { top: 24, bottom: 16, left: 20 } as const
export const CHAR_WIDTH = 7
export const CONTAINER_HEIGHT = 360

export const HEAD_LABEL = 'HEAD'
export const LABEL_CHAR_WIDTH = 6.6
export const LABEL_PILL_PADDING = 6
export const LABEL_PILL_GAP = 4

export const COLORS = {
  main: 'var(--color-accent-blue)',
  feature: 'var(--color-accent-green)',
} as const

export const TRANSITION = {
  enter: { duration: 0.3, ease: 'easeInOut' },
  exit: { duration: 0.15, ease: 'easeInOut' },
} as const
