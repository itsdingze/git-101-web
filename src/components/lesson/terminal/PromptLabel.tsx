import type { PromptInfo } from '@/lib/git-sim/createSandbox'

interface PromptLabelProps {
  prompt: PromptInfo
}

export function PromptLabel({ prompt }: PromptLabelProps) {
  return (
    <span className="shrink-0 whitespace-nowrap">
      <span className="text-terminal-prompt">{prompt.directory}</span>
      {prompt.branch && <span className="text-terminal-branch"> ({prompt.branch})</span>}
      <span className="text-terminal-prompt"> $</span>
    </span>
  )
}
