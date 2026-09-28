import type { ElementType } from 'react'
import inlineMarkdown from '@/lib/text/inlineMarkdown'

interface InlineMarkdownProps {
  value: string
  className?: string
  as?: ElementType
}

export default function InlineMarkdown({ value, className, as: Tag = 'p' }: InlineMarkdownProps) {
  return (
    <Tag
      className={className}
      // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml -- TRUSTED: static developer-authored lesson content from src/data/lessons/; never user input
      dangerouslySetInnerHTML={{ __html: inlineMarkdown(value) }}
    />
  )
}
