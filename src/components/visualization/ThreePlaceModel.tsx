import { useState } from 'react'
import { FileText, ArrowRight } from 'lucide-react'

type ZoneId = 'working' | 'staging' | 'repo'

const ZONES: { id: ZoneId; label: string; color: string }[] = [
  { id: 'working', label: 'Working Directory', color: 'var(--color-accent-red)' },
  { id: 'staging', label: 'Staging Area', color: 'var(--color-accent-yellow)' },
  { id: 'repo', label: 'Repository', color: 'var(--color-accent-green)' },
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
        <button
          onClick={reset}
          className="text-xs text-text-muted hover:text-text-secondary cursor-pointer
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary rounded"
        >
          Start over
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ZONES.map((zone, i) => (
          <div key={zone.id} className="relative">
            <div
              className="text-xs font-medium mb-2 text-center"
              style={{ color: zone.color }}
            >
              {zone.label}
            </div>
            <div className="bg-bg-secondary rounded-lg border border-border min-h-20 p-2 space-y-1.5">
              {currentFiles[zone.id].map((file) => (
                <div
                  key={file}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${zone.color} 6%, transparent)`,
                    color: zone.color,
                  }}
                >
                  <FileText size={12} />
                  {file}
                </div>
              ))}
            </div>
            {i < 2 && (
              <ArrowRight
                size={14}
                className="absolute top-1/2 -right-2.5 text-text-muted hidden md:block"
              />
            )}
          </div>
        ))}
      </div>

      {stage < STAGES.length - 1 ? (
        <button
          onClick={advance}
          className="w-full py-2 bg-bg-secondary hover:bg-bg-card border border-border rounded-lg text-sm font-mono text-text-primary cursor-pointer transition-colors
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          $ {COMMANDS[stage]}
        </button>
      ) : (
        <div className="text-center text-sm text-accent-green font-medium">
          All files committed — nothing left to stage
        </div>
      )}
    </div>
  )
}
