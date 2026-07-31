import CodeWalkthrough, { type WalkthroughStage } from './CodeWalkthrough'

const STAGES: WalkthroughStage[] = [
  {
    label: 'Original file',
    lines: [
      { text: 'function greet() {', kind: 'normal' },
      { text: '  return "Hello!";', kind: 'normal' },
      { text: '}', kind: 'normal' },
    ],
  },
  {
    label: 'File after your edit',
    lines: [
      { text: 'function greet() {', kind: 'normal' },
      { text: '  return "Hello, world!";', kind: 'normal' },
      { text: '}', kind: 'normal' },
    ],
  },
  {
    label: 'Diff output',
    command: 'git diff',
    lines: [
      { text: '--- a/greeting.js', kind: 'header' },
      { text: '+++ b/greeting.js', kind: 'header' },
      { text: '@@ -1,3 +1,3 @@', kind: 'header' },
      { text: ' function greet() {', kind: 'normal' },
      { text: '-  return "Hello!";', kind: 'removed' },
      { text: '+  return "Hello, world!";', kind: 'added' },
      { text: ' }', kind: 'normal' },
    ],
  },
]

export default function DiffWalkthrough() {
  return <CodeWalkthrough stages={STAGES} filename="greeting.js" />
}
