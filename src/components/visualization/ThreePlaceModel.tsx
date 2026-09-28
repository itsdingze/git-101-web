import { useState } from 'react'
import { FileText, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'

type ZoneId = 'working' | 'staging' | 'repo'

type FileState = 'new' | 'staged' | 'committed'

type Stage = {
  working: { name: string; state: FileState }[]
  staging: string[]
  repo: string[]
}

const ZONES: { id: ZoneId; label: string; labelColor: string }[] = [
  { id: 'working', label: 'Working Directory', labelColor: 'text-accent-red-strong' },
  { id: 'staging', label: 'Staging Area', labelColor: 'text-accent-yellow-strong' },
  { id: 'repo', label: 'Repository', labelColor: 'text-accent-green-strong' },
]

const FILE_STYLES: Record<Exclude<ZoneId, 'working'> | FileState, string> = {
  new: 'bg-accent-red/5 text-accent-red-strong',
  staged: 'bg-accent-yellow/10 text-accent-yellow-strong',
  committed: 'bg-bg-card text-text-secondary',
  staging: 'bg-accent-yellow/10 text-accent-yellow-strong',
  repo: 'bg-accent-green/5 text-accent-green-strong',
}

const STATE_LABELS: Record<FileState, string> = {
  new: 'new',
  staged: 'staged',
  committed: 'committed',
}

const STAGES: Stage[] = [
  {
    working: [
      { name: 'app.txt', state: 'new' },
      { name: 'settings.txt', state: 'new' },
    ],
    staging: [],
    repo: [],
  },
  {
    working: [
      { name: 'app.txt', state: 'staged' },
      { name: 'settings.txt', state: 'new' },
    ],
    staging: ['app.txt'],
    repo: [],
  },
  {
    working: [
      { name: 'app.txt', state: 'committed' },
      { name: 'settings.txt', state: 'new' },
    ],
    staging: [],
    repo: ['app.txt'],
  },
  {
    working: [
      { name: 'app.txt', state: 'committed' },
      { name: 'settings.txt', state: 'staged' },
    ],
    staging: ['settings.txt'],
    repo: ['app.txt'],
  },
  {
    working: [
      { name: 'app.txt', state: 'committed' },
      { name: 'settings.txt', state: 'committed' },
    ],
    staging: [],
    repo: ['app.txt', 'settings.txt'],
  },
]

const COMMANDS = [
  'git add app.txt',
  'git commit -m "feat: add task list"',
  'git add settings.txt',
  'git commit -m "feat: add settings"',
]

const arrowPosition =
  'pointer-events-none absolute left-1/2 -bottom-2.5 -translate-x-1/2 rotate-90 ' +
  'sm:left-auto sm:bottom-auto sm:-right-2.5 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:rotate-0'

function filesIn(stage: Stage, zone: ZoneId): { name: string; style: string; tag?: string }[] {
  if (zone === 'working') {
    return stage.working.map((file) => ({ name: file.name, style: FILE_STYLES[file.state], tag: STATE_LABELS[file.state] }))
  }
  return stage[zone].map((name) => ({ name, style: FILE_STYLES[zone] }))
}

export default function ThreePlaceModel() {
  const [stage, setStage] = useState(0)

  const current = STAGES[stage]!

  function advance() {
    setStage((s) => Math.min(s + 1, STAGES.length - 1))
  }

  function reset() {
    setStage(0)
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Git's Three Areas</span>
        <Button variant="text" size="sm" onClick={reset}>
          Start over
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ZONES.map((zone, i) => (
          <div key={zone.id} className="flex flex-col">
            <div className={`text-xs font-medium mb-2 text-center ${zone.labelColor}`}>
              {zone.label}
            </div>
            <div className="relative flex-1 bg-bg-secondary rounded-lg border border-border min-h-20 p-2 space-y-1.5">
              {filesIn(current, zone.id).map((file) => (
                <div
                  key={file.name}
                  className={`flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 px-2 py-1 rounded text-xs font-mono ${file.style}`}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <FileText size={12} className="shrink-0" aria-hidden />
                    <span className="min-w-0 wrap-break-word">{file.name}</span>
                  </span>
                  {file.tag && <span className="ml-auto shrink-0 font-sans">{file.tag}</span>}
                </div>
              ))}
              {i < 2 && <ArrowRight size={14} className={`${arrowPosition} text-text-muted`} />}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        Your files never leave the working directory. Staging marks a file for the next commit, and a commit
        saves a copy of it into the repository.
      </p>

      {stage < STAGES.length - 1 ? (
        <button
          type="button"
          onClick={advance}
          className="w-full min-h-11 px-4 bg-bg-secondary hover:bg-bg-card border border-border rounded-lg text-sm font-mono text-text-primary cursor-pointer transition-colors
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          $ {COMMANDS[stage]}
        </button>
      ) : (
        <div className="min-h-11 flex items-center justify-center text-center text-sm text-accent-green-strong font-medium">
          Both files are saved in commits, and both are still in your folder
        </div>
      )}
    </div>
  )
}
