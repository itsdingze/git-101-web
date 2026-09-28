import FeedbackPanel from '@/components/ui/FeedbackPanel'
import type { ResolutionVerdict } from '@/components/lesson/conflict-exercise/resolutionCheck'

interface SideLabels {
  ours: string
  theirs: string
}

function resolutionMessage(verdict: ResolutionVerdict, labels: SideLabels): string {
  switch (verdict) {
    case 'solved':
      return 'Resolved. The file reads as one version and every conflict marker is gone.'
    case 'marker-left':
      return 'A conflict marker is still in the file. Git treats `<<<<<<<`, `=======`, and `>>>>>>>` as ordinary text, so they travel to everyone who gets a copy of the project unless you delete all three lines yourself.'
    case 'kept-both':
      return 'Every marker is gone, but you kept both versions. This step asks for just one of them, so delete the line that should not stay.'
    case 'missing-side':
      return 'Every marker is gone, but one of the two lines went with them. This step needs both lines in the file.'
    case 'kept-ours':
      return `You kept the \`${labels.ours}\` version, the one from the branch you are on. This step asks for the \`${labels.theirs}\` version instead.`
    case 'kept-theirs':
      return `You kept the \`${labels.theirs}\` version, the one coming in. This step asks for the \`${labels.ours}\` version instead.`
    case 'near-miss':
      return 'Almost. A word or two differs from the version this step asks for. Check every line of the file against the instruction, letter by letter.'
    case 'wrong-content':
      return "Every marker is gone, but the file doesn't match what the step asks for yet. Reread the instruction above the editor."
  }
}

interface ResolutionFeedbackProps {
  id: string
  status: ResolutionVerdict | null
  labels: SideLabels
}

export default function ResolutionFeedback({ id, status, labels }: ResolutionFeedbackProps) {
  return (
    <div id={id} role="status" aria-live="polite">
      {status && (
        <FeedbackPanel tone={status === 'solved' ? 'right' : 'wrong'} message={resolutionMessage(status, labels)} />
      )}
    </div>
  )
}
