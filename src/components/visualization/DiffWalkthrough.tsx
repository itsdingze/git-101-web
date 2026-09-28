import CodeWalkthrough, { type WalkthroughStage } from './CodeWalkthrough'

const STAGES: WalkthroughStage[] = [
  {
    label: 'Original file',
    lines: [{ text: 'The lighthouse had been dark for a year.', kind: 'normal' }],
  },
  {
    label: 'File after your edit',
    lines: [
      {
        text: 'The lighthouse had been dark for a year, and nobody had asked why.',
        kind: 'normal',
      },
    ],
  },
  {
    label: 'Diff output',
    command: 'git diff',
    lines: [
      { text: '--- a/chapter-one.md', kind: 'header' },
      { text: '+++ b/chapter-one.md', kind: 'header' },
      { text: '@@ -1 +1 @@', kind: 'header' },
      { text: '-The lighthouse had been dark for a year.', kind: 'removed' },
      {
        text: '+The lighthouse had been dark for a year, and nobody had asked why.',
        kind: 'added',
      },
    ],
  },
]

export default function DiffWalkthrough() {
  return <CodeWalkthrough stages={STAGES} filename="chapter-one.md" />
}
