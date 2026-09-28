import CodeWalkthrough, { type WalkthroughStage } from './CodeWalkthrough'

const STAGES: WalkthroughStage[] = [
  {
    label: 'Original file',
    lines: [{ text: 'MAX_TASKS = 10', kind: 'normal' }],
  },
  {
    label: 'File after your edit',
    lines: [{ text: 'MAX_TASKS = 25', kind: 'normal' }],
  },
  {
    label: 'Diff output',
    command: 'git diff',
    lines: [
      { text: '--- a/settings.txt', kind: 'header' },
      { text: '+++ b/settings.txt', kind: 'header' },
      { text: '@@ -1 +1 @@', kind: 'header' },
      { text: '-MAX_TASKS = 10', kind: 'removed' },
      { text: '+MAX_TASKS = 25', kind: 'added' },
    ],
  },
]

export default function DiffWalkthrough() {
  return <CodeWalkthrough stages={STAGES} filename="settings.txt" />
}
