import CodeWalkthrough, { type WalkthroughStage } from './CodeWalkthrough'

const STAGES: WalkthroughStage[] = [
  {
    label: 'File is staged',
    lines: [
      { text: 'On branch main', kind: 'normal' },
      { text: 'Changes to be committed:', kind: 'header' },
      { text: '  modified:   settings.txt', kind: 'staged' },
    ],
  },
  {
    label: 'File unstaged, edits kept',
    command: 'git restore --staged settings.txt',
    lines: [
      { text: 'On branch main', kind: 'normal' },
      { text: 'Changes not staged for commit:', kind: 'header' },
      { text: '  modified:   settings.txt', kind: 'unstaged' },
    ],
  },
  {
    label: 'Changes discarded',
    command: 'git restore settings.txt',
    lines: [
      { text: 'On branch main', kind: 'normal' },
      { text: 'nothing to commit, working tree clean', kind: 'normal' },
    ],
  },
]

export default function RestoreWalkthrough() {
  return <CodeWalkthrough stages={STAGES} filename="$ git status" />
}
