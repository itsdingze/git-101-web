import { FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FOCUS_RING } from '@/components/ui/focusRing'
import type { ThreePlaceModelData } from '@/types'
import { commandsFor, stagesFor, zoneFiles, type FileState, type FileTone, type ZoneId } from './model/threePlaceStages'
import { useStageStepper } from './hooks/useStageStepper'
import { messages } from '@/messages/en'

const ZONES: { id: ZoneId; label: string; labelColor: string }[] = [
  { id: 'working', label: messages.reading.threePlaces.working, labelColor: 'text-accent-red-strong' },
  { id: 'staging', label: messages.reading.threePlaces.staging, labelColor: 'text-accent-yellow-strong' },
  { id: 'repo', label: messages.reading.threePlaces.repo, labelColor: 'text-accent-green-strong' },
]

const FILE_STYLES: Record<FileTone, string> = {
  new: 'bg-accent-red-tint text-accent-red-strong',
  staged: 'bg-accent-yellow-tint text-accent-yellow-strong',
  committed: 'bg-bg-card text-text-secondary',
  ignored: 'text-text-muted',
  staging: 'bg-accent-yellow-tint text-accent-yellow-strong',
  repo: 'bg-accent-green-tint text-accent-green-strong',
}

const STATE_LABELS: Record<FileState, string> = {
  new: messages.reading.threePlaces.untracked,
  staged: messages.reading.threePlaces.staged,
  committed: messages.reading.threePlaces.committed,
  ignored: messages.reading.threePlaces.ignored,
}

const arrowPosition =
  'pointer-events-none absolute left-1/2 -bottom-2.5 -translate-x-1/2 rotate-90 ' +
  'sm:left-auto sm:bottom-auto sm:-right-2.5 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:rotate-0'

export function ThreePlaceModel(data: ThreePlaceModelData) {
  const stages = stagesFor(data)
  const commands = commandsFor(data)
  const { index, atEnd, next, reset } = useStageStepper(stages.length)
  const current = stages[index]
  if (!current) return null

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{messages.reading.threePlaces.title}</span>
        <Button variant="text" size="sm" onClick={reset}>
          {messages.reading.threePlaces.startOver}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ZONES.map((zone, i) => (
          <div key={zone.id} className="flex flex-col">
            <div className={`text-xs font-medium mb-2 text-center ${zone.labelColor}`}>
              {zone.label}
            </div>
            <div className="relative flex-1 bg-bg-secondary rounded-lg border border-border min-h-20 p-2 space-y-1.5">
              {zoneFiles(current, zone.id).map((file) => (
                <div
                  key={file.name}
                  className={`flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 px-2 py-1 rounded text-xs font-mono ${FILE_STYLES[file.tone]}`}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <FileText size={12} className="shrink-0" aria-hidden />
                    <span className="min-w-0 wrap-break-word">{file.name}</span>
                  </span>
                  {file.state && <span className="ml-auto shrink-0 font-sans">{STATE_LABELS[file.state]}</span>}
                </div>
              ))}
              {i < 2 && <ArrowRight size={14} className={`${arrowPosition} text-text-muted`} />}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted leading-relaxed">{messages.reading.threePlaces.explanation}</p>

      {!atEnd ? (
        <button
          type="button"
          onClick={next}
          className={`w-full min-h-11 px-4 bg-bg-secondary hover:bg-bg-card border border-border rounded-lg text-sm font-mono text-text-primary cursor-pointer transition-colors
            ${FOCUS_RING}`}
        >
          $ {commands[index]}
        </button>
      ) : (
        <div className="min-h-11 flex items-center justify-center text-center text-sm text-accent-green-strong font-medium">
          {messages.reading.threePlaces.done}
        </div>
      )}
    </div>
  )
}
