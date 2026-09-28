import CodeWalkthrough, { type WalkthroughStage } from './CodeWalkthrough'

const STAGES: WalkthroughStage[] = [
  {
    label: 'Original file on main',
    lines: [
      { text: 'MAX_TASKS = 10', kind: 'normal' },
      { text: 'THEME = "light"', kind: 'normal' },
    ],
  },
  {
    label: 'CONFLICT: Automatic merge failed',
    command: 'git merge raise-limit',
    lines: [
      { text: '<<<<<<< HEAD', kind: 'marker-ours' },
      { text: 'MAX_TASKS = 15', kind: 'ours' },
      { text: '=======', kind: 'normal' },
      { text: 'MAX_TASKS = 50', kind: 'theirs' },
      { text: '>>>>>>> raise-limit', kind: 'marker-theirs' },
      { text: 'THEME = "light"', kind: 'normal' },
    ],
  },
  {
    label: 'Conflict resolved, markers removed',
    lines: [
      { text: 'MAX_TASKS = 50', kind: 'normal' },
      { text: 'THEME = "light"', kind: 'normal' },
    ],
  },
]

export default function ConflictMarkers() {
  return <CodeWalkthrough stages={STAGES} filename="settings.txt" />
}
