import { InlineMarkdown } from '@/components/ui/inline-markdown/InlineMarkdown'

interface HintPanelProps {
  hint: string
}

export function HintPanel({ hint }: HintPanelProps) {
  return (
    <InlineMarkdown
      as="div"
      className="bg-bg-secondary border border-border rounded-xl px-5 py-3.5 text-sm text-text-secondary leading-relaxed"
      value={hint}
    />
  )
}
