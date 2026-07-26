import CodeWalkthrough, { type WalkthroughStage } from './CodeWalkthrough'

const STAGES: WalkthroughStage[] = [
  {
    label: 'Original file on main',
    lines: [
      { text: '<html>', kind: 'normal' },
      { text: '  <body>', kind: 'normal' },
      { text: '    <h1>Welcome to our website!</h1>', kind: 'normal' },
      { text: '  </body>', kind: 'normal' },
      { text: '</html>', kind: 'normal' },
    ],
  },
  {
    label: 'CONFLICT: Automatic merge failed',
    command: 'git merge feature-banner',
    lines: [
      { text: '<html>', kind: 'normal' },
      { text: '  <body>', kind: 'normal' },
      { text: '<<<<<<< HEAD', kind: 'marker-ours' },
      { text: '    <h1>Welcome to our website!</h1>', kind: 'ours' },
      { text: '=======', kind: 'normal' },
      { text: '    <h1>Welcome to our amazing website!</h1>', kind: 'theirs' },
      { text: '>>>>>>> feature-banner', kind: 'marker-theirs' },
      { text: '  </body>', kind: 'normal' },
      { text: '</html>', kind: 'normal' },
    ],
  },
  {
    label: 'Conflict resolved — markers removed',
    lines: [
      { text: '<html>', kind: 'normal' },
      { text: '  <body>', kind: 'normal' },
      { text: '    <h1>Welcome to our amazing website!</h1>', kind: 'normal' },
      { text: '  </body>', kind: 'normal' },
      { text: '</html>', kind: 'normal' },
    ],
  },
]

export default function ConflictMarkers() {
  return <CodeWalkthrough stages={STAGES} filename="index.html" />
}
