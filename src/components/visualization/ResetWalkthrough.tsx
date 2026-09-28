import CodeWalkthrough, { type WalkthroughStage } from './CodeWalkthrough'

const STAGES: WalkthroughStage[] = [
  {
    label: 'Clean working tree',
    lines: [
      { text: 'On branch main', kind: 'normal' },
      { text: 'nothing to commit, working tree clean', kind: 'normal' },
    ],
  },
  {
    label: 'Changes kept staged',
    command: 'git reset --soft HEAD~1',
    lines: [
      { text: 'On branch main', kind: 'normal' },
      { text: 'Changes to be committed:', kind: 'header' },
      { text: '  modified:   app.txt', kind: 'staged' },
      { text: '  new file:   export.txt', kind: 'staged' },
    ],
  },
  {
    label: 'Changes unstaged',
    command: 'git reset HEAD~1',
    lines: [
      { text: 'On branch main', kind: 'normal' },
      { text: 'Changes not staged for commit:', kind: 'header' },
      { text: '  modified:   app.txt', kind: 'unstaged' },
      { text: '', kind: 'normal' },
      { text: 'Untracked files:', kind: 'header' },
      { text: '  export.txt', kind: 'unstaged' },
    ],
  },
  {
    label: 'Changes discarded',
    command: 'git reset --hard HEAD~1',
    lines: [
      { text: 'On branch main', kind: 'normal' },
      { text: 'nothing to commit, working tree clean', kind: 'normal' },
    ],
  },
]

export default function ResetWalkthrough() {
  return <CodeWalkthrough stages={STAGES} filename="$ git status" />
}
