import type { ElementType } from 'react'
import { inlineMarkdown } from '@/components/ui/inline-markdown/model/inlineMarkdown'

interface InlineMarkdownProps {
  value: string
  id?: string
  className?: string
  as?: ElementType
}

export function InlineMarkdown({ value, id, className, as: Tag = 'p' }: InlineMarkdownProps) {
  return (
    <Tag
      id={id}
      className={className}
      // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- TRUSTED: static developer-authored lesson content from src/data/lessons/; never user input
      dangerouslySetInnerHTML={{ __html: inlineMarkdown(value) }}
    />
  )
}
