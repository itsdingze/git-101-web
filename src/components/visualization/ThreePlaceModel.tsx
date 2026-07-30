import { useState } from 'react'
import { FileText, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'

type ZoneId = 'working' | 'staging' | 'repo'

const ZONES: { id: ZoneId; label: string; labelColor: string; fileColor: string }[] = [
  { id: 'working', label: 'Working Directory', labelColor: 'text-accent-red', fileColor: 'bg-accent-red/5 text-accent-red' },
  { id: 'staging', label: 'Staging Area', labelColor: 'text-accent-yellow', fileColor: 'bg-accent-yellow/5 text-accent-yellow' },
  { id: 'repo', label: 'Repository', labelColor: 'text-accent-green', fileColor: 'bg-accent-green/5 text-accent-green' },
]

const STAGES: { files: Record<ZoneId, string[]> }[] = [
  { files: { working: ['index.html', 'style.css'], staging: [], repo: [] } },
  { files: { working: ['style.css'], staging: ['index.html'], repo: [] } },
  { files: { working: ['style.css'], staging: [], repo: ['index.html'] } },
  { files: { working: [], staging: ['style.css'], repo: ['index.html'] } },
  { files: { working: [], staging: [], repo: ['index.html', 'style.css'] } },
]

const COMMANDS = [
  'git add index.html',
  'git commit -m "Add index"',
  'git add style.css',
  'git commit -m "Add style"',
]

const arrowPosition =
  'pointer-events-none absolute left-1/2 -bottom-2.5 -translate-x-1/2 rotate-90 ' +
  'sm:left-auto sm:bottom-auto sm:-right-2.5 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:rotate-0'

export default function ThreePlaceModel() {
  const [stage, setStage] = useState(0)

  const currentFiles = STAGES[stage]!.files

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
          <div key={zone.id}>
            <div className={`text-xs font-medium mb-2 text-center ${zone.labelColor}`}>
              {zone.label}
            </div>
            <div className="relative bg-bg-secondary rounded-lg border border-border min-h-20 p-2 space-y-1.5">
              {currentFiles[zone.id].map((file) => (
                <div
                  key={file}
                  className={`flex min-w-0 items-center gap-1.5 px-2 py-1 rounded text-xs font-mono ${zone.fileColor}`}
                >
                  <FileText size={12} className="shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
              ))}
              {i < 2 && <ArrowRight size={14} className={`${arrowPosition} text-text-muted`} />}
            </div>
          </div>
        ))}
      </div>

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
        <div className="min-h-11 flex items-center justify-center text-center text-sm text-accent-green font-medium">
          All files committed, nothing left to stage
        </div>
      )}
    </div>
  )
}
